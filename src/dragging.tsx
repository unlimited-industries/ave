import {NoteView} from "./model"


interface DraggParams {
    note: NoteView;
    eventX: number;
    eventY: number;
}

const dragg = ({note, eventX, eventY}: DraggParams) => {
    note.x = note.x + eventX - note.clickX;
    note.y = note.y + eventY - note.clickY;
    note.clickX = eventX
    note.clickY = eventY;
}

export default dragg;
