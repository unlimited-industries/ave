import { checkIfInRange } from "./common";

const checkIfBorderCollision = (border, mousePos, lowerLimit, upperLimit) => {
  return checkIfInRange(mousePos[0], border - 2, border + 2) && checkIfInRange(mousePos[1], lowerLimit, upperLimit);
}
  
const getBorderCollision = (note, pointer) => {
  let border = {north: false, south: false, west: false, east: false};

  border.north = checkIfBorderCollision(note.y, [pointer.y, pointer.x], note.x, note.x + note.width);
  border.south = checkIfBorderCollision(note.y + note.height, [pointer.y, pointer.x], note.x, note.x + note.width);
  border.west = checkIfBorderCollision(note.x, [pointer.x, pointer.y], note.y, note.y + note.height);
  border.east = checkIfBorderCollision(note.x + note.width, [pointer.x, pointer.y], note.y, note.y + note.height);

  return border;
}

const getBorderCursor = (border) => {
  if ((border.north && border.west) || (border.south && border.east)) return "nwse-resize";
  if ((border.north && border.east) || (border.south && border.west)) return "nesw-resize";
  if (border.west || border.east) return "ew-resize";
  if (border.north || border.south) return "ns-resize";
  return "default";
}

export { getBorderCollision, getBorderCursor };
