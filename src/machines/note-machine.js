import { and, assign, enqueueActions, fromEventObservable, not, sendParent, setup } from "xstate";
import { NoteBuilder } from "../util/note-builder";
import { fromEvent } from "rxjs";
import selectingMachine from './selecting-machine'
import { checkIfInRange } from "../util/common";
import { getBorderCollision, getBorderCursor } from "../util/border";
import detectCollision from "../util/collisions";
import { getGroup, getLink, splitGroups, tidyGroup } from "../util/groups";
import { resizingStrategy } from "../util/resizing"

const notesMachine = setup({
  actions: {
    addNotes: enqueueActions(({ context, event }) => {
      for (let builder of event.builders) {
        if (event.pointer !== undefined) {
          builder.setPosition(
            event.pointer.x - builder.note.width * 0.5,
            event.pointer.y - builder.note.height * 0.5
          );
        }
      }
      context.createNotes(event.builders);
    }),
    addMachine: assign(({ event, context }) => {
      const builder = event.machine.getSnapshot().context.builder;
      let dirs = { 'left': 0, 'top': 1, 'right': 2, 'bottom': 3 };
      let group = getGroup(builder);
      let groups = context.groups;

      if (group.groupId !== "" && group.linked !== '') {
        groups[group.groupId] ||= {};
        groups[group.groupId][builder.note.id] ||= {};
        groups[group.groupId][builder.note.id][dirs[group.dir]] = group.linked;
        groups[group.groupId][group.linked] ||= {};
        groups[group.groupId][group.linked][(dirs[group.dir] + 2) % 4] = builder.note.id;
      }

      context.children[event.id] = event.machine;
      return  {
        groups: groups,
        children: {...context.children, [event.id]: event.machine}
      }
    }),
    defineClickLocation: enqueueActions(({ context, enqueue }) => {
      const pointer = context.matrix.inverse().transformPoint(context.pointer);
      let maxX, maxY, minX, minY, link, temp;
      let clickLocation = { target: [undefined, undefined] };

      for (const id in context.children) {
        const machine = context.children[id];
        const builder = machine.getSnapshot().context.builder;
        const note = builder.note;
        const border = getBorderCollision(note, pointer);

        if (context.isLinksShown) {
          const sides = ({ 0: 'left', 1: 'top', 2: 'right', 3: 'bottom' });
          let diff = Math.abs((link - (temp = getLink(builder, undefined, pointer)))) % 4;
          if (temp !== undefined) {
            link = temp;
            if (isNaN(diff) && link !== undefined) clickLocation.target[0] = id;
            switch (diff) {
              case 0: clickLocation.target[0] = id; break;
              case 1: case 3: clickLocation.target[0] = id; clickLocation.target[1] = undefined; break;
              case 2: clickLocation.target[1] = id; break;
            }
            if (link !== undefined) clickLocation.location = `link:${sides[link]}`
          }
        }

        if (clickLocation?.location?.startsWith('link')) {  
          continue;
        }
        if (border.east || border.west || border.north || border.south) {
          clickLocation = { location: 'border', target: id }
          break;
        } 

        if (Object.keys(context.selected).length > 1) {
          if (context.selected[id]) {
            if (maxX == undefined || note.x + note.width > maxX) maxX = note.x + note.width;
            if (minX == undefined || note.x < minX) minX = note.x;
            if (maxY == undefined || note.y + note.height > maxY) maxY = note.y + note.height;
            if (minY == undefined || note.y < minY) minY = note.y;
          }
        } 
        if (checkIfInRange(pointer.x, note.x, note.x + note.width) &&
            checkIfInRange(pointer.y, note.y, note.y + note.height)) {
            clickLocation = { location: 'note', target: [undefined, id] };
        }
      }

      if (maxX !== undefined && checkIfInRange(pointer.x, minX, maxX) && checkIfInRange(pointer.y, minY, maxY)) {
        clickLocation = { location: 'selectedNotes', target: context.selected };
      }

      enqueue.assign({ clickLocation: clickLocation });
    }),
    resetClickLocation: assign(() => ({
      clickLocation: undefined
    })),
    setBorderAndCursor: assign(({ context }) => {
      for (const id of Object.keys(context.children).reverse()) {
        const machine = context.children[id];
        const note = machine.getSnapshot().context.builder.note;
        const pointer = context.matrix.inverse().transformPoint(context.pointer);
        const border = getBorderCollision(note, pointer);
        const cursor = getBorderCursor(border);
        if (cursor != 'default') return { cursor: cursor, border: border };
        if (checkIfInRange(pointer.x, note.x, note.x + note.width) &&
            checkIfInRange(pointer.y, note.y, note.y + note.height)) {
          return { cursor: 'default', border: { north: false, south: false, west: false, east: false }};
        }
      }
      return { cursor: 'default', border: { north: false, south: false, west: false, east: false }};
    }),
    setPointerPosition: assign(({ event }) => ({
      pointer: { x: event.x, y: event.y },
    })),
    setSelectionArea: assign(({ event }) => ({
      selectionArea: event.selectionArea,
    })),
    startSelecting: enqueueActions(({ context, enqueue }) =>
      enqueue.sendTo("selectingService", () => ({
        type: "START",
        pointer: context.pointer,
      }))
    ),
    draggNotes: enqueueActions(({ context, event, enqueue }) => {
      let builders = Object.keys(context.children).map((e) => [e, context.children[e].getSnapshot().context.builder]);
      builders = Object.fromEntries(builders);
      const notes = context?.clickLocation?.location === 'selectedNotes' ? context.selected : { [context.clickLocation?.target[1]]: true };
      let visited = {};
      for (let id in notes) {
        if (visited[id] !== undefined) continue;
        let pointer = context.matrix.inverse().transformPoint(new DOMPoint(event.x, event.y));
        let start = context.matrix.inverse().transformPoint(context.pointer)
        builders[id].setPosition(builders[id].note.x + pointer.x - start.x, builders[id].note.y + pointer.y - start.y);
        const group = getGroup(builders[id]);
        enqueue.assign(() => ({ cursor: "move" }));
        if (group.groupId !== '') tidyGroup(id, context.groups[group.groupId], builders, false);
        else enqueue.sendTo(context.children[id], { type: 'DRAGG', note: builders[id].note });

        for (let id2 in context.groups[group.groupId]) {
          enqueue.sendTo(context.children[id2], { type: 'DRAGG', note: builders[id2].note });
          visited[id2] = true;
        }
      }
    }),
    resizeNotes: enqueueActions(({ context, enqueue }) => {
      if (context?.clickLocation != undefined) {
        let builders = Object.keys(context.children).map((e) => [e, context.children[e].getSnapshot().context.builder]);
        builders = Object.fromEntries(builders);
        const id = context.clickLocation?.target;
        const group = getGroup(builders[id]);
        const resize = resizingStrategy(builders[id].note.dtype);
        const delta = resize(builders[id].note, context.matrix.inverse().transformPoint(context.pointer), context.border);
        builders[id].setPosition(builders[id].note.x + delta.x, builders[id].note.y + delta.y)
                    .setSize(builders[id].note.width + delta.width, builders[id].note.height + delta.height);

        if (group.groupId !== '') tidyGroup(id, context.groups[group.groupId], builders);
        else enqueue.sendTo(context.children[id], { type: 'RESIZE', note: builders[id].note });
        for (let id2 in context.groups[group.groupId]) {
          enqueue.sendTo(context.children[id2], { type: 'RESIZE', note: builders[id2].note });
        }
      }
    }),
    stopContentMachines: enqueueActions(({ enqueue, context }) => {
      for (const id in context.children) {
        const machine = context.children[id]; 
        const contentMachine = machine.getSnapshot().context.contentMachine;
        const snapshot = machine.getSnapshot().context.snapshot;
        if (snapshot !== undefined && snapshot.can({ type: 'STOP' })) enqueue.sendTo(contentMachine, { type: 'STOP' });
      }
    }),
    stopTextMachines: enqueueActions(({ enqueue, context }) => {
      for (const id in context.children) {
        const machine = context.children[id];
        const note = machine.getSnapshot().context.builder.note;
        const contentMachine = machine.getSnapshot().context.contentMachine;
        const snapshot = machine.getSnapshot().context.snapshot;
        if (['code', 'link', 'text'].includes(note.dtype) && snapshot.can({ type: 'STOP' })) {
          enqueue.sendTo(contentMachine, { type: 'STOP' });
        }
      }
    }),
    resumeContentMachines: enqueueActions(({ enqueue, context }) => {
      for (const id in context.children) {
        const machine = context.children[id]; 
        const contentMachine = machine.getSnapshot().context.contentMachine;
        if (contentMachine === undefined) continue;
        const snapshot = machine.getSnapshot().context.snapshot;
        if (snapshot.can({ type: 'RESUME' })) enqueue.sendTo(contentMachine, { type: 'RESUME' });
      }
    }),
    startTextMachine: enqueueActions(({ enqueue, context }) => {
      const machine = context.children[context.clickLocation.target[0]] || context.children[context.clickLocation.target[1]]; 
      const contentMachine = machine.getSnapshot().context.contentMachine;
      if (contentMachine === undefined) return;
      const snapshot = machine.getSnapshot().context.snapshot;
      if (snapshot.can({ type: 'TYPE' })) enqueue.sendTo(contentMachine, { type: 'TYPE' });
    }),
    selectNotes: enqueueActions(({ enqueue, context }) => {
      let selected = {};

      for (const id in context.children) {
        const machine = context.children[id];
        const note = machine.getSnapshot().context.builder.note;
        if (context.selectionArea === undefined) return;
        const matrix = context.matrix.inverse();
        const start = matrix.transformPoint(context.selectionArea.start);
        const end = matrix.transformPoint(context.selectionArea.end);

        const isCollision = detectCollision({
            left: start.x,
            right: end.x,
            top: start.y,
            bottom: end.y,
          },
          {
            left: note.x,
            right: note.x+ note.width,
            top: note.y,
            bottom: note.y + note.height,
          });
        if (isCollision) {
          enqueue.sendTo(machine, { type: 'SELECT' }); 
          selected[id] = true;
        }
      }
      enqueue.assign({ selected: { ...selected } })
    }),
    unselectNotes: enqueueActions(({ enqueue, context }) => {
      for (const id in context.children) {
        const machine = context.children[id]; 
        enqueue.sendTo(machine, { type: 'CANCEL' }); 
      }
      enqueue.assign({
        selected: {}
      })
    }),
    showLinks: assign(() => ({ isLinksShown: true })),
    hideLinks: assign(() => ({ isLinksShown: false })),
    linkNotes: enqueueActions(async ({ context }) => {
      if (!context.isLinksShown) return;
      const pointer = context.matrix.inverse().transformPoint(context.pointer);
      let link;
      let machine1 = context.children[context.clickLocation?.target[0]];
      let builder1 = machine1?.getSnapshot()?.context.builder;
      let machine2 = context.children[context.clickLocation?.target[1]];
      let builder2 = machine2?.getSnapshot()?.context?.builder
        || (new NoteBuilder()).setDtype('text').setWorkspaceId(context.workspaceId).setSize(220, 120);
      
      if (builder1 === undefined) {
        for (const id in context.children) {
          machine1 = context.children[id];
          builder1 = machine1.getSnapshot().context.builder;
          link = getLink(builder1, builder2);
          if (link !== undefined) break;
        }
      }
      link = link === undefined ? getLink(builder1, builder2, builder2.id === undefined ? pointer : undefined) : link;
      if (builder2.note.id === undefined) await context.createNotes([builder2]);
      let builders = Object.keys(context.children).map((e) => [e, context.children[e].getSnapshot().context.builder]);
      builders = Object.fromEntries(builders);
      builders[builder2.note.id] ||= builder2;

      let modifiedBuilders = splitGroups(context.groups, builders, builder1.note.id, builder2.note.id, link);
      modifiedBuilders = tidyGroup(builder1.note.id, context.groups[builder1.note.groupId], modifiedBuilders, true);
      modifiedBuilders = tidyGroup(builder1.note.id, context.groups[builder1.note.groupId], modifiedBuilders, true);

      for (let id in modifiedBuilders) {
        if (id === 'undefined') continue;
        context.children[id]?.send({ type: 'UPDATE', note: modifiedBuilders[id].note });
      }
    }),
    transfer: ({ context, event }) => {
      let maxX = Number.MIN_SAFE_INTEGER;
      let maxY = Number.MIN_SAFE_INTEGER;
      let minX = Number.MAX_SAFE_INTEGER;
      let minY = Number.MAX_SAFE_INTEGER;
      
      let builders = Object.keys(context.children).map((e) => [
        e,
        context.children[e].getSnapshot().context.builder
      ]);
      builders = Object.fromEntries(builders);
      
      let visited = {};
      
      const getExtremums = (id) => {
        const { x, y, width, height } = builders[id].note;
        maxX = Math.max(x + width, maxX);
        maxY = Math.max(y + height, maxY);
        minX = Math.min(x, minX);
        minY = Math.min(y, minY);
      };
      
      for (let id in context.selected) {
        if (visited[id]) continue;
        visited[id] = true;
        getExtremums(id);
        for (let id2 in context.groups[getGroup(builders[id]).groupId]) {
          visited[id2] = true;
          getExtremums(id2);
        }
      }
    
      const middleX = Math.trunc((maxX + minX) * 0.5);
      const middleY = Math.trunc((maxY + minY) * 0.5);
    
      for (let id in visited) {
        const builder = builders[id];
        const note = builder.setWorkspaceId(event.workspaceId)
                            .setPosition(builder.note.x - middleX, builder.note.y - middleY)
                            .note;
        
        context.children[id].send({ type: 'UPDATE', note });
      }
      context.tidyNotes(visited);
    },
  },
  actors: {
    mousedown: fromEventObservable(() => fromEvent(document, "mousedown")),
    mousemove: fromEventObservable(() => fromEvent(document, "mousemove")),
    mouseup: fromEventObservable(() => fromEvent(document, "mouseup")),
    keydown: fromEventObservable(() => fromEvent(document, "keydown")),
    keyup: fromEventObservable(() => fromEvent(document, "keyup")),
  },
  guards: {
    isMetaKey: ({ event }) => event.metaKey,
    leftClick: ({ event }) => event.button == 0,
    noClickLocation: ({ context }) => context.clickLocation.location === undefined,
    insideNote: ({ context }) => context.clickLocation?.location == 'note',
    border: ({ context }) => context.clickLocation?.location == 'border',
    selectionArea: ({ context }) => context.clickLocation?.location == 'selectionArea',
    selectedNotes: ({ context }) => context.clickLocation?.location == 'selectedNotes',
    link: ({ context }) => (context.clickLocation?.location || "").startsWith('link'),
    links: ({ context }) => (context.clickLocation?.location || "").startsWith('links'),
    noteActive: ({ context }) => {
      const machine = context.children[context.clickLocation.target[1]]; 
      const snapshot = machine.getSnapshot().context.snapshot;
      if(snapshot !== undefined && snapshot.matches({ typing: 'typing' })) return true;
      return false;
    },
  }
}).createMachine({
  id: 'notes',
  initial: 'idle',
  context: ({ input }) => ({
    createNotes: input.createNotes,
    updateNote: input.updateNote,
    tidyNotes: input.tidyNotes,
    workspaceId: input.workspaceId,
    matrix: input.matrix,
    cursor: 'default',
    children: {},
    groups: {},
    selected: {}
  }),
  states: {
    idle: {
      invoke: [
        {
          src: "mousemove",
        },
        {
          src: "mousedown",
        },
        {
          src: "mouseup",
        },
        {
          src: 'keydown'
        },
        {
          src: 'keyup'
        },
        {
          id: "selectingService",
          src: selectingMachine,
        },
      ],
      on: {
        STOP: {
          actions: 'stopContentMachines',
          target: 'stopped',
        },
        keydown: {
          guard: 'isMetaKey',
          actions: 'showLinks'
        },
        keyup: {
          actions: 'hideLinks'
        }
      },
      type: 'parallel',
      states: {
        a: {
          initial: 'receiveNotes',
          states: {
            receiveNotes: {
              on: {
                mousedown: {
                  target: 'clicked',
                  actions: ['setPointerPosition', 'defineClickLocation', sendParent({ type: 'STOP_TYPING'})],
                  guard: "leftClick"
                },
                mousemove: {
                  actions: ['setPointerPosition', 'setBorderAndCursor']
                },
                ADD_NOTES: {
                  actions: 'addNotes',
                },
              }
            },
            clicked: {
              initial: 'clickedSelectionArea',
              always: [
                {
                  target: 'selecting',
                  guard: 'noClickLocation',
                  actions: ["startSelecting", 'unselectNotes'],
                },
                {
                  target: 'receiveNotes',
                  guard: 'links',
                  actions: 'linkNotes'
                },
                {
                  target: 'clicked.link',
                  guard: 'link',
                },
              ],
              on: {
                mousemove: [
                  {
                    guard: 'selectedNotes',
                    actions: ['draggNotes', 'setPointerPosition', 'stopTextMachines'],
                    target: 'clicked.idle'
                  },
                  {
                    guard: and(['insideNote', not('noteActive')]),
                    actions: ['unselectNotes', 'draggNotes', 'setPointerPosition', 'stopTextMachines'],
                    target: 'clicked.dragging'
                  },
                  {
                    guard: 'border',
                    actions: ['unselectNotes', 'setPointerPosition', 'resizeNotes', 'stopTextMachines']
                  },
                ],
                mouseup: {
                  target: 'clicked.finish',
                },
              },
              states: {
                idle: {},
                dragging: {
                  on: {
                    mouseup: {
                      target: 'finish',
                      actions: 'linkNotes'
                    }
                  }
                },
                clickedSelectionArea: {
                  on: {
                    mouseup: [
                      {
                        target: 'finish',
                        actions: ['startTextMachine', 'unselectNotes', sendParent({ type: 'START_TYPING'})],
                        guard: 'insideNote'
                      },
                      {
                        target: 'finish',
                        actions: 'unselectNotes'
                      }
                    ],
                  }
                },
                link: {
                  on: {
                    mouseup: {
                      target: 'finish',
                      actions: 'linkNotes',
                    },
                    mousemove: {
                      target: 'finish'
                    },
                  },
                },
                moved: {
                  on: {
                    mouseup: {
                      target: 'finish',
                    },
                  }
                },
                finish: {
                  always: {
                    actions: ['resetClickLocation', 'setBorderAndCursor', 'resumeContentMachines'],
                    target: '#notes.idle.a.receiveNotes',
                  }
                }
              },
            },
            selecting: {
              on: {
                SELECTING_RESULT: {
                  actions: "setSelectionArea",
                },
                END_SELECTION: {
                  target: 'receiveNotes',
                  actions: ["selectNotes", "setSelectionArea"],
                },
                mousemove: {
                  actions: 'setPointerPosition'
                }
              }
            }
          },
        },
        b: {
          on: {
            ADD_MACHINE: {
              actions: 'addMachine'
            },
            SET_MATRIX: {
              actions: assign(({ event }) => ({ matrix: event.matrix }))
            },
            TRANSFER: {
              actions: 'transfer'
            },
          },
        }
      }
    },
    stopped: {
      on: {
        RESUME: {
          actions: 'resumeContentMachines',
          target: 'idle'
        }
      }
    }
  }
})

const noteMachine = setup({
  actors: {
    mouseup: fromEventObservable(() => fromEvent(document, "mouseup")),
  },
  actions: {
    setZIndex: assign(() => ({
      zIndex: 10
    })),
    addContentMachine: assign(({ event }) => ({
      contentMachine: event.machine,
      snapshot: event.snapshot
    })),
    resetZIndex: assign(() => ({
      zIndex: 1
    })),
    updateNote: assign(({ event, context }) => {
      context.update(event.note);
      return { builder: new NoteBuilder(event.note) }
    })
  }
}).createMachine({
  id: 'note',
  initial: 'idle',
  context: ({ input }) => ({
    builder: input.builder,
    zIndex: 1,
    update: input.update
  }),
  states: {
    idle: {
      invoke: {
        src: "mouseup",
      },
      initial: 'idle',
      on: {
        DRAGG: {
          actions: ['updateNote', 'setZIndex']
        },
        RESIZE: {
          actions: ['updateNote', 'setZIndex']
        },
        SELECT: {
          target: 'idle.selected'
        },
        ADD_MACHINE: {
          actions: 'addContentMachine'
        },
        mouseup: {
          actions: 'resetZIndex'
        },
        UPDATE: {
          actions: 'updateNote'
        }
      },
      states: {
        idle: {},
        selected: {
          on: {
            CANCEL: {
              target: 'idle',
            }
          }
        },
      }
    },
  }
});

export { notesMachine, noteMachine };
