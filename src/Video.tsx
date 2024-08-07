import { Accessor, Component } from 'solid-js';
import { NoteView, NoteModel, Workspace } from "./model";

interface VideoProps {
  selectionRange: Accessor<Range>;
	noteView: Accessor<NoteView>;
	note: NoteModel;
}

const Video: Component<VideoProps> = (props: VideoProps) => {
  const noteView = props.noteView;

  return (
    <video
      src={`http://localhost:80/api/files/${props.note.fileId}`}
      width={noteView().width + "px"}
      height={noteView().height + "px"}
      style={{
        "max-width": "none",
        "max-height": "none",
        border: noteView().isSelected
        && props.selectionRange() === null ? "1px solid #ff4d00" : "none"
      }} draggable="false">
    </video>
  )
}

export default Video;
