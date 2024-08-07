import {BorderCollision, NoteView, Workspace} from "./model"
import {checkIfInRange} from "./utils";

const checkIfBorderCollision = (border: number, mousePos: Array<number>, lowerLimit: number, upperLimit: number) => {
  return checkIfInRange(mousePos[0], border - 2, border + 2) && checkIfInRange(mousePos[1], lowerLimit, upperLimit);
}
  
const getBorderCollision = (note: NoteView, workspace: Workspace): BorderCollision => {
  let border: BorderCollision = {north: false as true, south: false as true, west: false as true, east: false as true};
  const mouseX = (workspace.mouseX - workspace.relativeX) / workspace.scale;
  const mouseY = (workspace.mouseY - workspace.relativeY) / workspace.scale;

  border.north = checkIfBorderCollision(note.y, [mouseY, mouseX], note.x, note.x + note.width) as true;
  border.south = checkIfBorderCollision(note.y + note.height, [mouseY, mouseX], note.x, note.x + note.width) as true;
  border.west = checkIfBorderCollision(note.x, [mouseX, mouseY], note.y, note.y + note.height) as true;
  border.east = checkIfBorderCollision(note.x + note.width, [mouseX, mouseY], note.y, note.y + note.height) as true;
    
  return border;
}

export {getBorderCollision};
