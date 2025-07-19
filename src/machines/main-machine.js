import { fromEvent } from "rxjs";
import { setup, fromEventObservable, assign, enqueueActions, fromPromise, sendTo, not, and, stateIn } from "xstate";
import { director, NoteBuilder } from "../util/note-builder";
import { notesMachine } from "./note-machine";

const machine = setup({
  actors: {
    keypress: fromEventObservable(() => fromEvent(document, "keypress")),
    keydown: fromEventObservable(() => fromEvent(document, "keydown")),
    keyup: fromEventObservable(() => fromEvent(document, "keyup")),
    mouseenter: fromEventObservable(() => fromEvent(document, "mouseenter")),
    mousedown: fromEventObservable(() => fromEvent(document, "mousedown")),
    mousemove: fromEventObservable(() => fromEvent(document, "mousemove")),
    wheel: fromEventObservable(() => fromEvent(document, "wheel")),
    drop: fromEventObservable(() => fromEvent(document, "drop")),
    paste: fromEventObservable(() => fromEvent(document, "paste")),
    addNotesActor: fromPromise(async ({ input }) => {
      let builders = [];
      const addNote = async (file, mime) => {
        let builder = await director(file, mime)();
        if (builder === undefined) return undefined;
        let formData = new FormData();
        formData.append("file", file);
        const response = await input.createFile(formData);
        return builder.setFileId(response["fileId"]).setWorkspaceId(input.workspaceId);
      }
      if (input.type === 'drop') {
        if (input.files?.length != undefined) {
          for (const file of input.files) builders.push(await addNote(file, file.type));
        }
      } else if (input.type === 'paste') {
        const clipboardItems = await navigator.clipboard.read();
        
        for (const file of clipboardItems) {
          for (const mime of file.types) {
            const blob = await file.getType(mime);
            const result = await addNote(blob, mime);
            if (result) builders.push(result);
          }
        }
      }
      return builders;
    })
  },
  guards: {
    isCreate: ({ event }) => ['KeyC', 'KeyL', 'KeyE'].includes(event.code),
    isMKey: ({ event }) => event.code === 'KeyM',
    isTKey: ({ event }) => event.code === 'KeyT',
    isDeleteKey: ({ event }) => event.key == "Backspace",
    isNotPointerPosition: ({ context }) => context.pointer === undefined,
    leftClick: ({ event }) => event.button == 0,
  },
  actions: {
    setPointerPosition: assign(({ event }) => ({
      pointer: { x: event.x, y: event.y },
    })),
    deleteNote: enqueueActions(({ context }) => {
      context.deleteNote();
    }),
    setMatrix: enqueueActions(({ context, event, enqueue }) => {
      if (context.getWorkspaceRef() == undefined) return;

      let matrix = new DOMMatrix(
        getComputedStyle(context.getWorkspaceRef()).transform
      );

      let matrixInversed = matrix.inverse();
      let scale = event.ctrlKey ? Math.round(event.deltaY) * -0.01 : 0;
      const point = matrixInversed.transformPoint(
        new DOMPoint(event.x, event.y)
      );

      if (scale != 0 && ((scale + 1) * matrix.a >= 0.2 || scale > 0)) {
        matrix.scaleSelf(1 + scale, 1 + scale, 1, point.x, point.y);
        if (matrix.a < 1) context.fetchNotes(context.workspaceId, matrix.inverse().transformPoint(), matrix.a);
      } else if (scale == 0) {        
        matrix.m41 -= event.deltaX;
        matrix.m42 -= event.deltaY;
        if (context.checkUpdate({ x: matrix.m41, y: matrix.m42 }, matrix.a)) {
          context.fetchNotes(context.workspaceId, matrix.inverse().transformPoint(), matrix.a);
        }
      }
      context.updateCookies(context.workspaceId, matrix.m41, matrix.m42, matrix.a);
      enqueue.sendTo('notesService', { type: "SET_MATRIX", matrix: matrix });
      enqueue.assign({ matrix: matrix }); 
    }),
    stopNoteMachine: enqueueActions(({ enqueue }) => {
      enqueue.sendTo('notesService', { type: "STOP" });
    }),
    resumeNoteMachine: enqueueActions(( { enqueue }) => {
      enqueue.sendTo('notesService', { type: "RESUME" });
    }),
    transferNotes: enqueueActions(( { enqueue, event }) => {
      enqueue.sendTo('notesService', { type: "TRANSFER", workspaceId: event.workspaceId });
    }),
  },
}).createMachine({
  id: "main",
  initial: "idle",
  context: ({ input }) => ({
    workspaceId: input.workspaceId,
    createNotes: input.createNotes,
    fetchNotes: (input.fetchNotes(input.workspaceId, input.matrix.inverse().transformPoint(), input.matrix.a), input.fetchNotes),
    updateNote: input.updateNote,
    deleteNotes: input.deleteNotes,
    createFile: input.createFile,
    deleteFile: input.deleteFile,
    checkUpdate: input.checkUpdate,
    getWorkspaceRef: input.getWorkspaceRef,
    updateCookies: input.updateCookies,
    tidyNotes: input.tidyNotes,
    matrix: input.matrix,
  }),
  type: 'parallel',
  states: {
    idle: {
      invoke: [
        {
          src: "keypress",
        },
        {
          src: "mouseenter",
        },
        {
          src: "mousemove",
        },
        {
          src: "keydown",
        },
        {
          src: "keyup",
        },
        {
          src: "wheel",
        },
        {
          src: "drop"
        },
        {
          src: "paste"
        },
        {
          id: 'notesService',
          src: notesMachine,
          input: ({ context }) => ({
            updateNote: context.updateNote,
            workspaceId: context.workspaceId,
            createNotes: context.createNotes,
            matrix: context.matrix,
            tidyNotes: context.tidyNotes
          }),
        },
      ],
      initial: "start",
      states: {
        start: {
          on: {
            mouseenter: {
              guard: "isNotPointerPosition",
              actions: "setPointerPosition",
            },
            keypress: {
              guard: and(['isCreate', not(stateIn({ typing: 'typing'}))]),
              actions: sendTo('notesService', ({ context, event }) => (
                { type: 'ADD_NOTES', 
                  builders: [
                    (() => {
                      const m = {
                        'KeyC': [220, 120, 'text'],
                        'KeyE': [680, 400, 'code'],
                        'KeyL': [220, 120, 'link'],
                      };
                      const [w, h, dtype] = m[event.code] ?? [];
                      return new NoteBuilder().setSize(w, h).setDtype(dtype).setWorkspaceId(context.workspaceId);
                    })()
                  ],
                  pointer: context.matrix.inverse().transformPoint(context.pointer)
                }
              )),
            },
            keydown: [
              // {
              //   guard: "isDeleteKey",
              //   actions: "deleteNote",
              // }, 
              {
                guard: and(['isMKey', not(stateIn({ typing: 'typing'}))]),
                actions: 'stopNoteMachine',
                target: 'workspaceListShown.switching'
              },
              {
                guard: and(['isTKey', not(stateIn({ typing: 'typing'}))]),
                actions: 'stopNoteMachine',
                target: 'workspaceListShown.transferring'
              }
            ],
            mousemove: {
              actions: "setPointerPosition",
            },
            mousedown: {
              actions: "setPointerPosition",
            },
            wheel: {
              actions: "setMatrix",
            },
            drop: {
              target: 'adding',
              actions: assign(({ event }) => ({ newNotesType: 'drop', files: event.dataTransfer.files }))
            },
            paste: {
              target: 'adding',
              actions: assign(() => ({ newNotesType: 'paste' }))
            },
            OPEN_WORSKPACE_LIST: {
              target: 'workspaceListShown.switching'
            }
          },
        },
        adding: { 
          invoke: {
            src: 'addNotesActor',
            input: ({ context }) => ({
              files: context.files,
              type: context.newNotesType,
              createFile: context.createFile,
              workspaceId: context.workspaceId
            }),
            onDone: {
              target: 'start',
              actions: sendTo('notesService', ({ event, context }) => ({
                type: 'ADD_NOTES',
                builders: event.output,
                pointer: context.matrix.inverse().transformPoint(context.pointer)
              }))
            }
          }
        },
        workspaceListShown: {
          initial: 'transfering',
          states: {
            transferring: {
              on: {
                keydown: {
                  guard: 'isTKey',
                  target: '#main.idle.start',
                  actions: 'resumeNoteMachine'
                },
                SELECT_WS: {
                  target: '#main.idle.start',
                  actions: ['resumeNoteMachine', 'transferNotes']
                },
                CLOSE: {
                  target: '#main.idle.start',
                  actions: 'resumeNoteMachine'
                }
              },
            },
            switching: {
              on: {
                keydown: {
                  guard: 'isMKey',
                  target: '#main.idle.start',
                  actions: 'resumeNoteMachine'
                },
                CLOSE: {
                  target: '#main.idle.start',
                  actions: 'resumeNoteMachine'
                }
              }
            },
          },
        },
      },
    },
    typing: {
      initial: 'idle',
      on: {
        START_TYPING: {
          target: '#main.typing.typing'
        },
        STOP_TYPING: {
          target: '#main.typing.idle'
        }
      },
      states: {
        idle: {},
        typing: {}
      }
    }
  }
});

export default machine;
