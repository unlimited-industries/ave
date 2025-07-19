import { getVideoDimensions } from "./files"

function createSetter(...fields) {
  return new Function(`
    return function(${fields.join(', ')}) {
      ${fields.map(field => `this.note.${field} = ${field};`).join(' ')}
      return this;
    }
  `)();
}

class NoteBuilder {
  constructor(note) { this.note = note || {}; }
}

NoteBuilder.prototype.setId = createSetter('id');
NoteBuilder.prototype.setPosition = createSetter('x', 'y');
NoteBuilder.prototype.setSize = createSetter('width', 'height');
NoteBuilder.prototype.setBody = createSetter('body');
NoteBuilder.prototype.setFileId = createSetter('fileId');
NoteBuilder.prototype.setDtype = createSetter('dtype');
NoteBuilder.prototype.setWorkspaceId = createSetter('workspaceId');
NoteBuilder.prototype.setGroupId = createSetter('groupId');
NoteBuilder.prototype.setGroup = createSetter('group');

const idleDirector = (size, dtype, body) => new NoteBuilder({}).setDtype(dtype).setSize(size.width, size.height).setBody(body);

const match = (cond, mime, getSize, dtype, body) => {
  if (cond == '*') return () => undefined;
  if (mime.startsWith(cond)) {
    const f = async () => idleDirector(await getSize(), dtype || cond, body || "");
    return (f.case = () => f, f);
  } else return match;
}

const director = (file, mime) => (match.case = match, match
  .case("image", mime , async () => await createImageBitmap(file))
  .case("video", mime, () => getVideoDimensions(file))
  .case("audio", mime, {width: 100, height: 500})
  .case("application", mime, {width: 80, height: 600}, "file").
  case("*")
)

const NoteArrangementStrategies = Object.freeze({
  SINGLE_NOTE: Symbol("single_note"),
  DRAG_AND_DROP: Symbol("drag_and_drop"),
});

export { NoteBuilder, idleDirector, director, NoteArrangementStrategies };
