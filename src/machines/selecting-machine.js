import { fromEvent } from 'rxjs';
import { assign, fromEventObservable, sendParent, setup } from 'xstate';

const selectingMachine = setup({
  actors: {
    mouseup: fromEventObservable(() => fromEvent(document, 'mouseup')),
    mousemove: fromEventObservable(() => fromEvent(document, 'mousemove')),
  },
  actions: {
    setSelectionArea: assign({
      start: ({ event }) => event.pointer
    }),
    setWorkspaceRef: assign({
      workspaceRef: ({ event }) => event.workspaceRef
    }),
    sendResult: sendParent(({ context, event }) => ({
      type: "SELECTING_RESULT",
      selectionArea: {
        start: {
          x: Math.min(context.start.x, event.x),
          y: Math.min(context.start.y, event.y)
        },
        end: {
          x: Math.max(context.start.x, event.x),
          y: Math.max(context.start.y, event.y)
        },
      }
    })),
    reset: sendParent(() => ({
      type: "END_SELECTION",
      selectionArea: undefined
    }))
  }
}).createMachine(
  {
    id: "selecting",
    initial: "idle",
    states: {
      idle: {
        on: {
          START: {
            target: 'selecting',
            actions: 'setSelectionArea', 
          }
        },
      },
      selecting: {
        invoke: [
          {
            src: 'mouseup'
          },
          {
            src: 'mousemove',
          }
        ],
        on: {
          mouseup: {
            target: "idle",
            actions: "reset"
          },
          mousemove: {
            actions: 'sendResult'
          }
        },
      },
    }
  }
)

export default selectingMachine;
