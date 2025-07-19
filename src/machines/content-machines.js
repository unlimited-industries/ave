import { setup } from "xstate";

const textMachine = setup({}).createMachine({
  id: "text",
  initial: "typing",
  states: {
    idle: {
      on: {
        RESUME: {
            target: "#text.typing.history",
        },
        START: {
          target: "#text.typing.typing",
        }
      },
    },
    typing: {
      initial: "idle",
      states: {
        idle: {
          on: {
            TYPE: {
              target: "typing",
            },
          },
        },
        typing: {
          on: {
            CANCEL: {
              target: "idle",
            },
          },
        },
        history: {
          type: "history",
        },
      },
      on: {
        STOP: {
          target: "idle",
        },
      },
    },
  },
});

const playbackMachine = setup({}).createMachine({
  id: "playback",
  initial: "idle",
  states: {
    idle: {
      on: {
        RESUME: {
            target: "#playback.playing.history",
        },
        START: {
          target: "#playback.playing.playing",
        }
      },
    },
    playing: {
      initial: "paused",
      states: {
        paused: {
          on: {
            PLAY: {
              target: "playing",
            },
          },
        },
        playing: {
          on: {
            PAUSE: {
              target: "paused",
            },
          },
        },
        history: {
          type: "history",
        },
      },
      on: {
        STOP: [
          {
            target: "idle",
          },
        ],
      },
    },
  },
});

export { textMachine, playbackMachine };
