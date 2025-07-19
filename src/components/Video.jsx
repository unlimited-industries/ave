import { createSignal, onCleanup } from "solid-js";
import axios from "axios";
import { useActor } from "@xstate/solid";
import { playbackMachine } from "../machines/content-machines";

const Video = (props) => {
  const [snapshot, send, actorRef] = useActor(playbackMachine);
  props.machine.send({ type: "ADD_MACHINE", machine: actorRef, snapshot: snapshot });

  const [videoUrl, setVideoUrl] = createSignal(undefined);

  const fetchVideo = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/files/${props.note.fileId}`,
        {
          responseType: "blob",
        }
      );
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    } catch (error) {
      console.error("Error fetching video:", error);
    }
  };

  onCleanup(() => URL.revokeObjectURL(videoUrl()));

  fetchVideo();

  return (
    <video draggable="false" class="h-full w-full">
      {videoUrl() && <source src={videoUrl()} type="video/mp4" />}
    </video>
  );
};

export default Video;
