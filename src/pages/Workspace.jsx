import { createEffect, createMemo, createResource, createSignal, For, Show, untrack } from "solid-js";
import Cookies from "js-cookie";
import machine from "../machines/main-machine";
import { fromActorRef, useActor } from "@xstate/solid";
import { useParams } from "@solidjs/router";
import SelectionArea from "../components/SelectionArea";
import WorkspaceArea from "./Workspace.styles";
import Note from "../components/Note";
import { NoteBuilder } from "../util/note-builder";
import { createNote, fetchNotes, updateNote } from "../api/notes";
import { calculateRange, checkIfRangeForUpdate } from "../util/range";
import WorkspaceList from "../components/WorkspacesList";
import { createFile, deleteFile } from "../api/files";
import { fetchWorkspace } from "../api/workspaces";
import { formatTitle } from "../util/common";

const Workspace = () => {
  let workspaceRef;
  let workspaceId = useParams().id;
  fetchWorkspace(workspaceId).then((workspace) => document.title = formatTitle(workspace.name));

  const [searchOptions, setSearchOptions] = createSignal();
  const [notes, { mutate }] = createResource(
    searchOptions, async (searchOptions, { value }) => {
      if (workspaceId === import.meta.env.VITE_DELETE_WS) return [];

      let fetchedNotes = await fetchNotes(searchOptions);
      let newNotes = [];
      let groups = {};

      value = value || [];
      value = value.filter((note) => fetchedNotes.some((newNote) => newNote.id === note.id));
      fetchedNotes = fetchedNotes.filter((newNote) => !value.some((note) => note.id === newNote.id));

      for (let note of [...value, ...fetchedNotes]) {
        if (note.groupId !== undefined && !groups[note.groupId]) {
          groups[note.groupId] = true;
          newNotes = newNotes.concat(await fetchNotes({ ...searchOptions, groupId: note.groupId }));
        } else if (note.groupId === undefined) {
          newNotes.push(note);
        }
      }

      return newNotes.sort((a, b) => parseInt(a.id) - parseInt(b.id));
    }
  );

  const [snapshot, send] = useActor(machine, {
    input: {
      workspaceId: useParams().id,
      matrix: ((cookies) => (new DOMMatrix()).translate(cookies["x"] || Math.round(-window.outerWidth * 0.5),
        cookies["y"] || Math.round(-window.outerHeight * 0.5)).scale(cookies["scale"] || 1.0))(JSON.parse(Cookies.get(useParams().id) || "{}")),
      createNotes: async (noteBuilders) => {
        for (let builder of noteBuilders) {
          builder.setId((await createNote(builder.note)).noteId);
        }
        let newNotes = noteBuilders.map((value) => value.note);
        mutate([...notes(), ...newNotes])
      },
      fetchNotes: (workspaceId, pos, scale) => setSearchOptions({
        range: calculateRange(pos, scale),
        workspaceId: workspaceId,
      }),
      updateNote: updateNote,
      deleteNotes: (noteId) => console.log("delete note", noteId),
      createFile: (file) => createFile(file),
      deleteFile: (fileId) => deleteFile(fileId),
      checkUpdate: (pos, scale) => checkIfRangeForUpdate(pos, scale, searchOptions().range),
      updateCookies: (id, x, y, scale) => Cookies.set(id, JSON.stringify({ x: x, y: y, scale: scale })),
      getWorkspaceRef: () => workspaceRef,
      tidyNotes: (toRemove) => mutate(notes().filter(note => !toRemove[note.id]))
    }
  });

  if (workspaceId === import.meta.env.VITE_DELETE_WS) {
    send({ type: 'OPEN_WORSKPACE_LIST'});
  }

  const notesSnapshot = fromActorRef(snapshot.children.notesService);

  return (
    <>
      <Show when={snapshot.matches({ idle: 'workspaceListShown' })}>
        <div class="absolute flex w-screen h-screen items-center justify-center z-10 backdrop-blur-sm">
          <WorkspaceList
            machine={snapshot}
            send={send}
          ></WorkspaceList>
        </div>
      </Show>
      <Show when={notesSnapshot()?.context?.selectionArea !== undefined}>
        <SelectionArea selectionArea={notesSnapshot().context.selectionArea}/>
      </Show>
      <WorkspaceArea cursor={notesSnapshot().context.cursor} ref={workspaceRef} matrix={snapshot.context.matrix}>
        <For each={notes()}>
          {note => (
            <Note notesMachine={snapshot.children.notesService} builder={new NoteBuilder(note)}></Note>
          )}
        </For>
      </WorkspaceArea>
    </>
  );
};

export default Workspace;
