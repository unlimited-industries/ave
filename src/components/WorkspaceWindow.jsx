import {
  createMemo,
  createSignal,
  Show,
} from "solid-js";
import { createWorkspace, fetchWorkspace, updateWorkspace } from "../api/workspaces";
import { createFile, deleteFile } from "../api/files";
import WorkspaceList from "../components/WorkspacesList"

const WorkspaceWindow = (props) => {
  const [imageSrc, setImageSrc] = createSignal(null);
  const [isDragging, setIsDragging] = createSignal(false);
  const [name, setName] = createSignal("");
  const [isTyping, setIsTyping] = createSignal(false);
  const [isLinked, setIsLinked] = createSignal(props.workspace?.relatedTo != "0");
  const [isLinking, setIsLinking] = createSignal(false)

  if (props.action == "update") {
    setName(props.workspace.name);
    if (props.workspace?.fileId) {
      setImageSrc(`${import.meta.env.VITE_SERVER_URL}/files/${props.workspace?.fileId}`);
    }
  }

  const handleImageDrag = (event) => {
    event.preventDefault();
    setIsDragging(true);
  }

  const handleImageDragLeave = () => {
    setIsDragging(false);
  }

  const handleImageDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const blob = new Blob([e.target.result]);
        const url = URL.createObjectURL(blob);
        setImageSrc(url);
      };
      reader.readAsArrayBuffer(file);
    }
  }

  const handleKeyboard = (event) => {
    if (isTyping()) {
      event.stopImmediatePropagation();
    }
  }

  const handleClickButton = async () => {
    let fileId = undefined;

    if (imageSrc()?.startsWith("blob")) {
      const response = await fetch(imageSrc());
      const blob = await response.blob();
  
      const formData = new FormData();
      formData.append('file', blob);
  
      fileId = (await createFile(formData))["fileId"];
    }

    if (props.action == "create") {
      const newWorkspace = await fetchWorkspace(props.workspaceId);
      await createWorkspace({
        id: undefined,
        name: name(),
        fileId: fileId,
        relatedTo: props.isLocal ? (newWorkspace.relatedTo == "0" ? props.workspaceId : newWorkspace.relatedTo) : "0"
      });
      props.show(false);
      props.updateWorkspaceList();
    } else if (props.action == "update") {
      if (props.workspace?.fileId && fileId != undefined) {
        await deleteFile(props.workspace?.fileId);
      }

      await updateWorkspace({
        id: props.workspace.id,
        name: name(),
        fileId: fileId
      });
      props.show(false);
      props.updateWorkspaceList();
    }
  }

  const handleLink = async () => {
    if (!isLinked()) {
      setIsLinking(true);
    } else {
      await updateWorkspace({
        id: props.workspace.id,
        relatedTo: "0"
      });
      props.show(false);
      props.updateWorkspaceList();
    }
  }

  const link = async (workspaceId) => {
    await updateWorkspace({
      id: props.workspace.id,
      relatedTo: workspaceId
    });
    setIsLinked(true);
    props.updateWorkspaceList();
    setIsLinking(false);
  }

  return (
    <>
      <Show when={isLinking()}>x
        <div class="flex absolute w-screen h-screen z-10 items-center justify-center">
          <WorkspaceList machine={props.machine} action={link} close={() => setIsLinking(false)}></WorkspaceList>
        </div>
      </Show>
      <div onKeyDown={handleKeyboard} class="relative flex w-2/3 h-3/5 p-8 pe-5 gap-8 bg-zinc-700">
        <div onDragOver={handleImageDrag} onDrop={handleImageDrop} onDragLeave={handleImageDragLeave}
          class="workspace-window-img-upload relative w-1/2 aspect-square border border-zinc-500 rounded-md border-dashed">
          <div class="relative w-full h-full flex justify-center items-center overflow-clip">
            <Show when={imageSrc()} fallback={
              <>
                <img src="src/assets/drag-drop.png" class="absolute"/>
                <img src="src/assets/drag-drop-hover.png"
                  class={`workspace-window-img absolute ${isDragging() ? "opacity-100": "opacity-0"}`}/>
              </>}>
              <img src={imageSrc()} class="aspect-auto"></img>
            </Show>
          </div>
        </div>
        <div class="flex w-full justify-between flex-col">
          <div class="flex w-full h-1/6 mt-14 items-center space-x-3">
            <input value={name()} onInput={e => setName(e.target.value)}
              onFocusIn={() => setIsTyping(true)} onFocusOut={() => setIsTyping(false)} class="border border-zinc-600 outline-none rounded-md bg-transparent caret-zinc-400 w-full h-full text-white px-3"></input>
              <Show when={props.action == 'update'}>
                <button class='h-3/5' onClick={handleLink}>
                  <Show when={isLinked()} fallback={
                    <img class='h-full' src='src/assets/unlinked.png'/>}>
                    <img class='h-full' src='src/assets/linked.png'/>
                  </Show>
                </button>
              </Show>
          </div>
          <div class="flex justify-center items-center w-full h-1/6">
            <button onClick={handleClickButton} class="bg-sky-500 w-40 h-10 rounded-md text-white">
              {props.action == "create" ? "Create" : "Update"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkspaceWindow;
