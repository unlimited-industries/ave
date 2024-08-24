import { createSignal, Component, createResource, Signal, For, Show, onMount, createMemo, lazy, untrack} from 'solid-js';
import { Workspace, Range, NoteModel } from './model';
import { fetchNotes, updateNote, deleteNote, createFile, createNote, deleteFile } from './server';
import { calculateRange, checkIfRangeForUpdate } from './range';
import { getVideoDimensions } from './files';
import Note from './Note';
import Cookies from 'js-cookie';
import axios from 'axios'; 
import SelectionBox from './SelectionBox';

const App: Component = () => {
  axios.defaults.baseURL = "http://localhost:80/api"; 

  const workspace: Workspace = {
    x: Math.round(-window.outerWidth * 0.5),
    y: Math.round(-window.outerHeight * 0.5),
    relativeX: 0,
    relativeY: 0,
    width: window.outerWidth,
    height: window.outerHeight,
    mouseX: 0,
    mouseY: 0,
    scale: 1.0,
    isDragging: false as true,
    isResizing: false as true,
    isTyping: false as true
  };

  const [fetchedNotes, setFetchedNotes] = createSignal([]);
  const [range, setRange]: Signal<Range> = createSignal();

  const [notes, { mutate }] = createResource(range, async (range, { value }: {value: Array<NoteModel>}) => {
    const newNotes = await fetchNotes(range);
    value = value || [];

    const filteredNewNotes = newNotes.filter(newNote =>
      !value.some(existingNote => existingNote.id === newNote.id)
    );

    try {
      return [...value, ...filteredNewNotes];
    } finally {
      setFetchedNotes(newNotes);
    }
  });

  createMemo(() => {
    let newNotes = [...untrack(notes) || []];

    const ids = newNotes.map(note => note.id).filter(id => !fetchedNotes().some(fetchedNote => fetchedNote.id === id));

    for (let id of ids) {
      newNotes = newNotes.filter(item => item.id !== id);
    }
    mutate(newNotes.sort((a, b) => +a.id - +b.id));
  });

  const [selectionRange, setSelectionRange] = createSignal(null);

  const xCookie: string = Cookies.get("x");
  const yCookie: string = Cookies.get("y");
  const scaleCookie: string = Cookies.get("scale");

  if (xCookie != undefined) {
    workspace.x = parseInt(xCookie, 10);
  }
  if (yCookie != undefined) {
    workspace.y = parseInt(yCookie, 10);
  }
  if (scaleCookie != undefined) {
    workspace.scale = parseFloat(scaleCookie);
  }

  setRange(calculateRange(workspace));
  
  document.addEventListener("mousedown", (event: MouseEvent) => {
    if (event.button != 0) return;

    let isMoved = false;
    setSelectionRange(undefined);

    let startX = (event.x - workspace.relativeX) / workspace.scale;
    let startY = (event.y - workspace.relativeY) / workspace.scale;

    const handleMouseMove = (event: MouseEvent) => {
      isMoved = true;

      let x = (event.x - workspace.relativeX) / workspace.scale;
      let y = (event.y - workspace.relativeY) / workspace.scale;
      
      setSelectionRange(undefined);
      setSelectionRange({
          start: [Math.min(startX, x), Math.min(startY, y)],
          end: [Math.max(startX, x), Math.max(startY, y)]
      });
    }  

    if (!(workspace.isDragging || workspace.isResizing)) {
      document.addEventListener("mousemove", handleMouseMove);
    }

    document.addEventListener("mouseup", function handleMouseUp() {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      setSelectionRange(isMoved ? null: undefined);
    });
  });

  onMount(() => {
    const workspaceDOM = document.getElementById("workspace");
    const rect = workspaceDOM.getBoundingClientRect();
    document.documentElement.style.setProperty('--workspace-left', -rect.x / workspace.scale + "px");
    document.documentElement.style.setProperty('--workspace-top', -rect.y / workspace.scale + "px");
    document.documentElement.style.setProperty('--workspace-width', workspace.width / workspace.scale + "px");
    document.documentElement.style.setProperty('--workspace-height', workspace.height / workspace.scale + "px");

    workspaceDOM.addEventListener('mousemove', (event: MouseEvent) => {
      workspace.mouseX = event.x;
      workspace.mouseY = event.y;
      if (!workspace.isResizing && !workspace.isDragging) {
        document.body.style.cursor = "default";
      }
    });

    workspaceDOM.addEventListener('wheel', (event: WheelEvent) => {
      const workspaceDOM = document.getElementById("workspace");
      event.preventDefault(); 
      document.body.style.cursor = "default";

      if (event.ctrlKey) {
        let delta = Math.round(event.deltaY) * -0.01;
  
        if (workspace.scale + delta >= 0.1 || delta > 0) {
          let rect = workspaceDOM.getBoundingClientRect();
          workspace.relativeX += ((event.x - rect.x) * -delta) / workspace.scale;
          workspace.relativeY += ((event.y - rect.y) * -delta) / workspace.scale;
          workspace.x += event.x * (1 / workspace.scale - 1 / (workspace.scale + delta));
          workspace.y += event.y * (1 / workspace.scale - 1 / (workspace.scale + delta));

          workspace.scale = workspace.scale + delta;

          workspaceDOM.style.transform = `scale(${workspace.scale})`;
          workspaceDOM.style.left = workspace.relativeX + "px";
          workspaceDOM.style.top = workspace.relativeY + "px";

          rect = workspaceDOM.getBoundingClientRect();
          document.documentElement.style.setProperty('--workspace-left', -rect.x / workspace.scale + "px");
          document.documentElement.style.setProperty('--workspace-top', -rect.y / workspace.scale + "px");
          document.documentElement.style.setProperty('--workspace-width', workspace.width / workspace.scale + "px");
          document.documentElement.style.setProperty('--workspace-height', workspace.height / workspace.scale + "px");

          if (workspace.scale < 1) {
            setRange(calculateRange(workspace));
          }
        }
      } else {
        workspace.relativeX -= event.deltaX;
        workspace.relativeY -= event.deltaY;
        workspace.x += (event.deltaX / workspace.scale);
        workspace.y += (event.deltaY / workspace.scale);
        workspaceDOM.style.left = workspace.relativeX + "px";
        workspaceDOM.style.top = workspace.relativeY + "px";
        const rect = workspaceDOM.getBoundingClientRect();
        document.documentElement.style.setProperty('--workspace-left', -rect.x / workspace.scale + "px");
        document.documentElement.style.setProperty('--workspace-top', -rect.y / workspace.scale + "px");

        if (checkIfRangeForUpdate(workspace, range())) {
          setRange(calculateRange(workspace));
        } 
      }
      Cookies.set("x", workspace.x.toString());
      Cookies.set("y", workspace.y.toString());
      Cookies.set("scale", workspace.scale.toString());
    }, { passive: false });
  })

  const handleAddNote = async (mouseX: number, mouseY: number) => {
    let note: NoteModel = {
      id: undefined,
      x: mouseX - 100,
      y: mouseY - 50,
      width: 200, 
      height: 100,
      body: "",
      fileId: "",
      dtype: "text"
    }
    createNote(note).then(response => {
      note.id = response.noteId; 
      mutate([...notes(), note]);
    });
  };

  document.addEventListener('keypress', (event) => {
    if (["c", "\u0441"].includes(event.key.toLowerCase()) && !workspace.isTyping) {
      handleAddNote(
        Math.round(workspace.mouseX / workspace.scale + workspace.x),
        Math.round(workspace.mouseY / workspace.scale + workspace.y)
      );
    }
  }); 

  let deletionQueue: Set<string> = new Set();

  document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === 'Backspace') {
      let newNotes = [...notes()];

      for (let id of deletionQueue) {
        const note = newNotes.find(item => item.id === id);
        if (note.fileId) {
          deleteFile(note.fileId);
        }
        newNotes = newNotes.filter(item => item.id !== id);
        deleteNote(id);
      }
      mutate(newNotes);
      deletionQueue = new Set();
    }
  });

  document.addEventListener("dragover", (event) => {
    event.preventDefault();
  })

  document.addEventListener("drop", async (event) => {
    event.preventDefault();

    const files = event.dataTransfer.files;
    let dtype: string;
    let width: number;
    let height: number;
    if (files[0].type.startsWith("image")) {
      dtype = "image";
      const bmp = await createImageBitmap(files[0]);
      ({ width, height } = bmp);
    } else if (files[0].type.startsWith("video")) {
      dtype = "video";
      ({ width, height } = await getVideoDimensions(files[0]));
    } else if (files[0].type.startsWith("audio")) {
      dtype = "audio";
    } else if (files[0].type.startsWith("application")) {
      dtype = "file";
    }
    
    let formData = new FormData();
    formData.append('file', files[0]);
    const data = await createFile(formData);
    let note: NoteModel = {
      id: undefined,
      x: Math.round(workspace.mouseX / workspace.scale + workspace.x - width * 0.5),
      y: Math.round(workspace.mouseY / workspace.scale + workspace.y - height * 0.5),
      width: Math.round(width), 
      height: Math.round(height),
      body: "",
      fileId: data["fileId"], 
      dtype: dtype
    };
    let response = await createNote(note);
    note.id = response.noteId;
    mutate([...notes(), note]);
  });

  document.addEventListener("paste", async () => {
    const data = await navigator.clipboard.read();
    data.forEach(item => {
      item.types.forEach(async mimeType => {
        if (mimeType.startsWith("image")) {
          const blob = await item.getType(mimeType);
          const bmp = await createImageBitmap(blob);
          const { width, height } = bmp;

          let formData = new FormData();
          formData.append('file', blob, "image.png"); 

          const data = await createFile(formData);
          let note: NoteModel = {
            id: undefined,
            x: Math.round(workspace.mouseX / workspace.scale + workspace.x - width * 0.5),
            y: Math.round(workspace.mouseY / workspace.scale + workspace.y - height * 0.5),
            width: Math.round(width), 
            height: Math.round(height),
            body: "",
            fileId: data["fileId"], 
            dtype: "image"
          };
          let response = await createNote(note);
          note.id = response.noteId;
          mutate([...notes(), note]);
        };
      });
    });
  });

  return (
    <>
      <div id="workspace" style={{
        position: "absolute",
        width: workspace.width + "px",
        height: workspace.height + "px",
        transform: `scale(${workspace.scale})`,
        "transform-origin": "top left"
      }}>
        <Show when={selectionRange() != null}>
          <SelectionBox selectionRange={selectionRange()}/>
        </Show>

        <For each={notes()}>{(note, noteIndex) =>
          <Note note={note}
            setNote={async (note: NoteModel) => {
              const newNotes = [...notes()];
              newNotes[noteIndex()] = note;
              await updateNote(note);
              mutate(newNotes);
            }}
            addToDeletionQueue={() => deletionQueue.add(note.id)}
            deleteFromDeletionQueue={() => deletionQueue.delete(note.id)}
            workspace={workspace}
            selectionRange={selectionRange}/>
        }
        </For>
      </div>
    </>
  );
};

export default App;
