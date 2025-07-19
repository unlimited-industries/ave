import { fromActorRef, useActor } from "@xstate/solid";
import { Match, Show, Switch } from "solid-js";
import { noteMachine } from "../machines/note-machine";
import { styled } from "solid-styled-components";
import { codeResize, proportionResize, resize } from '../util/resizing';
import Code from './Code';
import Link from './Link';
import Text from './Text'
import Image from './Image'
import Video from './Video'

const NoteStyle = styled("div")`
  left: ${props => props.note.x}px;
  top: ${props => props.note.y}px;
  width: ${props => props.note.width}px;
  height: ${props => props.note.height}px;
  z-index: ${props => props.zIndex};
`;

const Note = (props) => {
  const dtype = props.builder.note.dtype;
  const notesSnapshot = fromActorRef(props.notesMachine);
  const [snapshot, send, actorRef] = useActor(noteMachine, {input: {
    builder: props.builder,
    update: notesSnapshot().context.updateNote,
    resize: dtype == 'code' ? codeResize : (['image', 'video'].includes(dtype) ? proportionResize : resize)
  }});
  const note = snapshot.context.builder.note;

  props.notesMachine.send({ type: "ADD_MACHINE", machine: actorRef, id: note.id });
  return <>
    <NoteStyle class={`absolute ${snapshot.matches("idle.selected") ? "outline outline-[#ff4d00]" : ""}
      `} note={snapshot.context.builder.note}
      zIndex={snapshot.context.zIndex}>
      <Show when={notesSnapshot().context.isLinksShown}>
        <div class="absolute top-[-50px] left-1/2 -translate-x-1/2 w-10 h-10 border-2 border-blue-500 rounded-full"></div>
        <div class="absolute bottom-[-50px] left-1/2 -translate-x-1/2 w-10 h-10 border-2 border-blue-500 rounded-full"></div>
        <div class="absolute left-[-50px] top-1/2 -translate-y-1/2 w-10 h-10 border-2 border-blue-500 rounded-full"></div>
        <div class="absolute right-[-50px] top-1/2 -translate-y-1/2 w-10 h-10 border-2 border-blue-500 rounded-full"></div>
      </Show>
      <Switch>
        <Match when={dtype == "text"}>
          <Text note={snapshot.context.builder.note} updateNote={notesSnapshot().context.updateNote} machine={actorRef}/>
        </Match>
        <Match when={dtype == 'code'}>
          <Code note={snapshot.context.builder.note} updateNote={notesSnapshot().context.updateNote} machine={actorRef}></Code>
        </Match>
        <Match when={dtype == 'link'}>
          <Link note={snapshot.context.builder.note} updateNote={notesSnapshot().context.updateNote} machine={actorRef}></Link>
        </Match>
        <Match when={dtype == 'video'}>
          <Video note={snapshot.context.builder.note} machine={actorRef}/>
        </Match>
        <Match when={dtype == 'image'}>
          <Image note={snapshot.context.builder.note}/>
        </Match>
      </Switch>
    </NoteStyle>
  </>
}

export default Note;
