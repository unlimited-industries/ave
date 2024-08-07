interface Range {
  start: [number, number];
  end: [number, number];
}

interface NoteModel {
  id: string;
  x: number;
  y: number;
  width: number; 
  height: number;
  body: string;
  fileId: string;
  dtype: string;
}

interface NoteView {
  x: number;
  y: number;
  width: number; 
  height: number;
  zIndex: number;
  clickX: number;
  clickY: number;
  border: BorderCollision;
  isSelected: true;
}

interface BorderCollision {
  north: true,
  south: true,
  west: true, 
  east: true
}

interface Workspace {
  x: number;
  y: number;
  relativeX: number;
  relativeY: number;
  width: number;
  height: number;
  mouseX: number;
  mouseY: number;
  scale: number;
  isDragging: true;  
  isResizing: true;  
  isTyping: true;
}

const modelToView = (note: NoteModel, workspace: Workspace) => {
  return {
    x: note.x - workspace.x - workspace.relativeX / workspace.scale,
    y: note.y - workspace.y - workspace.relativeY / workspace.scale,
    width: note.width,
    height: note.height
  }
}

export {Range, NoteModel, NoteView, Workspace, BorderCollision, modelToView}
