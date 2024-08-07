import { Accessor, Component } from 'solid-js';
import { NoteView, NoteModel, Workspace, Range} from "./model";

interface TextProps {
	workspace: Workspace;
  selectionRange: Accessor<Range>;
	noteView: Accessor<NoteView>;
	note: NoteModel;
	setNote: (note: NoteModel) => void;
}

const Text: Component<TextProps> = (props: TextProps) => {
	const noteView = props.noteView;
	let textarea: any;

	const handleInput = () => {
		props.note.body = textarea.value;
		props.setNote(props.note);
  }

  const handleFocus = () => {
    props.workspace.isTyping = true;
  }

  const handleFocusOut = () => {
    props.workspace.isTyping = false as true;
  }

  return (
		<div
			style={{
       width: `${noteView().width}px`,
        height: `${noteView().height}px`,
        background: "#252525",
        border: noteView().isSelected
          && props.selectionRange() === null ? "1px solid #ff4d00" : "none"
      }}>
      <textarea onInput={handleInput} onFocus={handleFocus} onFocusOut={handleFocusOut}
        ref={textarea}
        style={{
          "font-size": 15 + "px",
          padding: 20 + "px",
        }}
        class="resize-none text-zinc-400 w-full h-full bg-transparent focus:outline-none">
          {props.note.body}
      </textarea>
    </div>
  )
}

export default Text;
