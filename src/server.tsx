import {NoteModel, Range} from "./model"
import axios from "axios";

interface Note {
  id: string;
  position: [number, number];
  size: [number, number];
  body: string;
  file_id: string;
  dtype: string;
}

const convertToNote = (note: NoteModel): Note => {
  return {
    id: note.id,
    position: [note.x, note.y],
    size: [note.width, note.height],
    body: note.body,
    file_id: note.fileId,
    dtype: note.dtype
  }
}

const convertToNoteModel = (note: Note): NoteModel => {
  return {
    id: note.id,
    x: note.position[0], y: note.position[1],
    width: note.size[0], height: note.size[1],
    body: note.body,
    dtype: note.dtype,
    fileId: note.file_id
  };
} 

const fetchNotes = async (range: Range) => {
  let filter = "";
  if (range != undefined) {
    filter = `?x=${range.start[0]}:${range.end[0]}&y=${range.start[1]}:${range.end[1]}`;
  }
  return ((await axios.get<Array<Note>>("/notes" + filter)).data || []).map(note => convertToNoteModel(note));
  };
  
const createNote = async (note: NoteModel) => {
  const response = await axios.post("/notes", convertToNote(note));
  return response.data;
};
  
const deleteNote = async (noteId: string) => {
  await axios.delete(`/notes/${noteId}`);
}

const updateNote = async (note: NoteModel) => {
  await axios.put(`/notes/${note.id}`, convertToNote(note));
}

const createFile = async (file: object) => {
  const response = await axios.post("/files", file, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
}

const deleteFile = async (fileId: string) => {
  await axios.delete(`/files/${fileId}`);
}

export {fetchNotes, createNote, deleteNote, updateNote, createFile, deleteFile};
