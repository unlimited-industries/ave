import { NoteView } from "./model";

const resize = (note: NoteView, eventX: number, eventY: number, aspectRatio: number=-1): void => {
  if (note.border.north) {
    note.y = note.y + note.height;
    note.height = Math.max(note.y - eventY, 20);
    note.y = note.y - note.height;
    note.width = (aspectRatio == -1) ? note.width : note.height * aspectRatio;

    if (note.height > 20) {
      note.y = eventY;
    }
  } else if (note.border.south) {
    note.height = Math.max(eventY - note.y, 20);
    note.width = (aspectRatio == -1) ? note.width : note.height * aspectRatio;
  }

  if (note.border.west) {
    note.x = note.x + note.width;
    note.width = Math.max(note.x - eventX, 20);
    note.x = note.x - note.width;
    note.height = (aspectRatio == -1) ? note.height : note.width / aspectRatio;

    if (note.width > 20) {
      note.x = eventX;
    }
  } else if (note.border.east) {
    note.width = Math.max(eventX - note.x, 20);
    note.height = (aspectRatio == -1) ? note.height : note.width / aspectRatio;
  }
}

const proportionResize = (note: NoteView, eventX: number, eventY: number) => {
  const aspectRatio = note.width / note.height;
  const width = note.width;
  const height = note.height;
  if (note.border.east && note.border.south) {
    note.width += ((eventX - note.x - note.width) + (eventY - note.y - note.height)) * 0.5;
    note.height = note.width / aspectRatio;
  } else if (note.border.west && note.border.south) {
    note.width += ((note.x - eventX) + (eventY - note.y - note.height)) * 0.5;
    note.height = note.width / aspectRatio;
    note.x -= note.width - width;
  } else if (note.border.east && note.border.north) {
    note.width += ((eventX - note.x - note.width) + (note.y - eventY)) * 0.5;
    note.height = note.width / aspectRatio;
    note.y -= note.height - height;
  } else if (note.border.west && note.border.north) {
    note.width += ((note.x - eventX) + (note.y - eventY)) * 0.5;
    note.height = note.width / aspectRatio;
    note.x -= note.width - width;
    note.y -= note.height - height;
  } else {
    resize(note, eventX, eventY, aspectRatio);
  }
}


export {resize, proportionResize};

