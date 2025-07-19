const resize = (note, pointer, border, minWidth = 20, minHeight = 20, aspectRatio = -1) => {
  let width = note.width;
  let height = note.height;
  let x = note.x;
  let y = note.y;

  if (border.north) {
    y = y + height;
    height = Math.max(y - pointer.y, minHeight);
    y = y - height;
    width = (aspectRatio == -1) ? width : height * aspectRatio;

    if (height > minHeight) {
      y = pointer.y;
    }
  } else if (border.south) {
    height = Math.max(pointer.y - y, minHeight);
    width = (aspectRatio == -1) ? width : height * aspectRatio;
  }

  if (border.west) {
    x = x + width;
    width = Math.max(x - pointer.x, minWidth);
    x = x - width;
    height = (aspectRatio == -1) ? height : width / aspectRatio;

    if (width > minWidth) {
      x = pointer.x;
    }
  } else if (border.east) {
    width = Math.max(pointer.x - x, minWidth);
    height = (aspectRatio == -1) ? height : width / aspectRatio;
  }
  return { width: width - note.width, height: height - note.height, x: x - note.x, y: y - note.y};
}

const proportionResize = (note, pointer, border, minWidth = 20, minHeight = 20) => {
  const aspectRatio = note.width / note.height;
  let width = note.width;
  let height = note.height;
  let x = note.x;
  let y = note.y;
  if (border.east && border.south) {
    width += ((pointer.x - x - width) + (pointer.y - y - height)) * 0.5;
    height = width / aspectRatio;
  } else if (border.west && border.south) {
    width += ((x - pointer.x) + (pointer.y - y - height)) * 0.5;
    height = width / aspectRatio;
    x -= width - note.width;
  } else if (border.east && border.north) {
    width += ((pointer.x - x - width) + (y - pointer.y)) * 0.5;
    height = width / aspectRatio;
    y -= height - note.height;
  } else if (border.west && border.north) {
    width += ((x - pointer.x) + (y - pointer.y)) * 0.5;
    height = width / aspectRatio;
    x -= width - note.width;
    y -= height - note.height;
  } else {
    return resize(note, pointer, border, minWidth, minHeight, aspectRatio);
  }

  return { width: width - note.width, height: height - note.height, x: x - note.x, y: y - note.y };
}

const codeResize = (note, pointer, border) => {
  return proportionResize(note, pointer, border, 620, 360);
}

const resizingStrategy = (dtype) => {
  if (dtype == 'code') return codeResize;
  if (dtype == 'video' || dtype == 'audio' || dtype == 'image') return proportionResize;
  return resize;
}

export { resize, proportionResize, codeResize, resizingStrategy };
