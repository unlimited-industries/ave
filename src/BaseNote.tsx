import { Accessor, Component, Setter , createEffect, createMemo } from 'solid-js';
import { NoteModel, Workspace, NoteView, modelToView, Range, BorderCollision} from './model';
import dragg from "./dragging";
import { getBorderCollision } from './border';
import { checkIfInRange, detectCollision } from './utils'

interface BaseNoteProps {
  note: NoteModel;
  setNote: (note: NoteModel) => void;
  workspace: Workspace;
  noteView: Accessor<NoteView>;
  setNoteView: Setter<NoteView>;
  addToDeletionQueue: () => void;
  deleteFromDeletionQueue: () => void;
  selectionRange: Accessor<Range>;
  resize: (note: NoteView, eventX: number, eventY: number) => void;
  children: any
}

const BaseNote: Component<BaseNoteProps> = (props: BaseNoteProps) => {
  const noteView = props.noteView;
  const setNoteView = props.setNoteView;
  
  createMemo(() => {
    const selectionRange = props.selectionRange();
    setNoteView((prev) => (
      {...prev, 
        ...modelToView(props.note, props.workspace),
        isSelected: (selectionRange != null ? detectCollision({
          left: selectionRange.start[0], right: selectionRange.end[0],
          top: selectionRange.start[1], bottom: selectionRange.end[1]
        }, {
          left: prev.x, right: prev.x + prev.width,
          top: prev.y, bottom: prev.y + prev.height
        }
      ): prev.isSelected) as true}
    ));
  });

  createEffect(() => {
    if (noteView().isSelected && props.selectionRange() === null) {
      props.addToDeletionQueue();
    } else {
      props.deleteFromDeletionQueue();
    }
  });

  const handleMouseDown = (event: MouseEvent): void => {
    if (event.button != 0) return;
    const note = { ...noteView(), zIndex: 2 };

    const eventX = (event.x - props.workspace.relativeX) / props.workspace.scale;
    const eventY = (event.y - props.workspace.relativeY) / props.workspace.scale;

    const handleMouseMove = (event: MouseEvent): void => {

      const eventX = (event.x - props.workspace.relativeX) / props.workspace.scale;
      const eventY = (event.y - props.workspace.relativeY) / props.workspace.scale;

      if (props.workspace.isDragging) {
        dragg({ note, eventX, eventY}); 
      } else if (props.workspace.isResizing) {
        props.resize(note,eventX, eventY);
      }

      props.note.x = Math.round(note.x + props.workspace.x + props.workspace.relativeX / props.workspace.scale);
      props.note.y = Math.round(note.y + props.workspace.y + props.workspace.relativeY / props.workspace.scale);
      props.note.width = Math.round(note.width);
      props.note.height = Math.round(note.height);
      
      setNoteView({ ...note });
      props.setNote(props.note);
    } 

    const handleMouseUp = (): void => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      note.zIndex = 1;

      setNoteView({ ...note });
      props.workspace.isDragging = false as true;
      props.workspace.isResizing = false as true;
      document.body.style.cursor = "default";
    }

    document.addEventListener('mousemove', handleMouseMove);  
    document.addEventListener('mouseup', handleMouseUp);

    if (note.border.north || note.border.south || note.border.west || note.border.east) { 
      props.workspace.isResizing = true;
    } else if (checkIfInRange(eventX, note.x, note.x + note.width)
       && checkIfInRange(eventY, note.y, note.y + note.height)) {
        props.workspace.isDragging = true;
        note.clickX = eventX;
        note.clickY = eventY;
        document.body.style.cursor = "move";
    }
    setNoteView({ ...note });
  }

  const handleMouseMove = (): void => {
    const note = { ...noteView() };

    if (!props.workspace.isDragging && !props.workspace.isResizing) {
      note.border = getBorderCollision(note, props.workspace);
      let cursor: string;
      if (note.border.north && note.border.west || note.border.south && note.border.east) {
        cursor = "nwse-resize";
      } else if (note.border.north && note.border.east || note.border.south && note.border.west) {
        cursor = "nesw-resize";
      } else if (note.border.west || note.border.east) {
        cursor = "ew-resize";
      } else if (note.border.north || note.border.south) {
        cursor = "ns-resize";
      } else {
        cursor = "default"
      }
      document.body.style.cursor = cursor;
      setNoteView({ ...note });
    }
  }

  return (
    <div class={"note"}
      style={{
        padding: "10px",
        position: 'absolute',
        left: `${noteView().x - 10}px`,
        top: `${noteView().y - 10}px`,
        "z-index": noteView().zIndex
      }}
      onmousemove={handleMouseMove}
      onmousedown={handleMouseDown}
    >
      {props.children}
    </div>
  );
};

export default BaseNote;
