const Image = (props) => {
  return (
    <img class="h-full w-full" src={`${import.meta.env.VITE_SERVER_URL}/files/${props.note.fileId}`} draggable="false"></img>
  );
};

export default Image;
