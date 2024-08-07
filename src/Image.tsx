import { Accessor, Component } from 'solid-js';
import { NoteView, NoteModel, Range } from "./model";

interface ImageProps {
	noteView: Accessor<NoteView>;
  selectionRange: Accessor<Range>;
	note: NoteModel;
}

const Image: Component<ImageProps> = (props: ImageProps) => {
  const noteView = props.noteView;

  return (
    <img
      src={`http://localhost:80/api/files/${props.note.fileId}`}
      width={noteView().width + "px"}
      height={noteView().height + "px"}
      style={{
        "max-width": "none",
        "max-height": "none",
        border: noteView().isSelected
        && props.selectionRange() === null ? "1px solid #ff4d00" : "none"
      }} draggable="false">
    </img>
  )
}

export default Image;
