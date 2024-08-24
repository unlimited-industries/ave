import { Component } from "solid-js";
import { Workspace, NoteModel, NoteView, Range, modelToView } from './model';
import { Accessor, Switch, Match, Signal, createSignal } from 'solid-js';
import Text from './Text'
import BaseNote from "./BaseNote";
import Image from './Image'
import Video from './Video'
import { proportionResize, resize } from "./resizing";

interface NoteProps {
  note: NoteModel;
  setNote: (note: NoteModel) => void;
  workspace: Workspace;
  addToDeletionQueue: () => void;
  deleteFromDeletionQueue: () => void;
  selectionRange: Accessor<Range>
}

const Note: Component<NoteProps> = (props: NoteProps) => {
  const [noteView, setNoteView]: Signal<NoteView> = createSignal({
    zIndex: 1,
    clickX: 0,
    clickY: 0,
    border: { north: false as true, west: false as true, south: false as true, east: false as true },
    isSelected: false as true,
    ...modelToView(props.note, props.workspace)
  });

  let dtype = props.note.dtype;

  return <>
    <Switch fallback={dtype}>
      <Match when={dtype == "text"}>
        <BaseNote {...props} noteView={noteView} setNoteView={setNoteView} resize={resize}>
          <Text workspace={props.workspace} selectionRange={props.selectionRange} noteView={noteView} note={props.note} setNote={props.setNote}/>
        </BaseNote>
      </Match>
      <Match when={dtype == "image"}>
        <BaseNote {...props} noteView={noteView} setNoteView={setNoteView} resize={proportionResize}>
          <Image selectionRange={props.selectionRange} noteView={noteView} note={props.note}/>
        </BaseNote>
      </Match>
      <Match when={dtype == "video"}>
        <BaseNote {...props} noteView={noteView} setNoteView={setNoteView} resize={proportionResize}>
          <Video selectionRange={props.selectionRange} noteView={noteView} note={props.note}/>
        </BaseNote>
      </Match>
    </Switch>
  </>
}

export default Note;
