import { Accessor, Component, createSignal, onCleanup } from 'solid-js';
import axios from 'axios';
import { NoteView, NoteModel, Range } from "./model";

interface VideoProps {
  selectionRange: Accessor<Range>;
  noteView: Accessor<NoteView>;
  note: NoteModel;
}

const Video: Component<VideoProps> = (props: VideoProps) => {
  const [videoUrl, setVideoUrl] = createSignal<string | undefined>(undefined);
  const noteView = props.noteView;

  const fetchVideo = async () => {
    try {
      const response = await axios.get(`http://localhost:80/api/files/${props.note.fileId}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);

    } catch (error) {
      console.error('Error fetching video:', error);
    }
  };

  onCleanup(() => URL.revokeObjectURL(videoUrl()));

  fetchVideo();

  return (
    <video
      width={noteView().width + "px"}
      height={noteView().height + "px"}
      style={{
        "max-width": "none",
        "max-height": "none",
        border: noteView().isSelected
        && props.selectionRange() === null ? "1px solid #ff4d00" : "none"
      }} draggable="false" controls>
      {videoUrl() && <source src={videoUrl()} type="video/mp4"/>}
    </video>
  );
};

export default Video;
