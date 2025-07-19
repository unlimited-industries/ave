import { useActor } from "@xstate/solid";
import { textMachine } from "../machines/content-machines";

const Text = (props) => {
  const note = props.note;
  const [snapshot, send, actorRef] = useActor(textMachine);
  props.machine.send({ type: "ADD_MACHINE", machine: actorRef, snapshot: snapshot });
  let textarea;

  const handleMouseDown = () => {
    if (!snapshot.matches({ typing: 'typing' })) {
      textarea.blur();
    }
  }

  const handleClick = () => {
    textarea.focus();
    textarea.setSelectionRange(textarea.selectionStart, textarea.selectionEnd);
  }

  const handleFocusOut= () => {
    textarea.blur();
    send({ type: 'CANCEL' });
  }

  const handleMouseUp = () => {
    textarea.blur();
  }

  return (
    <div class="bg-[#252525] w-full h-full" onMouseUp={handleMouseUp}>
      <textarea ref={textarea} class={`text-[15px] p-5 resize-none text-zinc-400 w-full h-full bg-transparent focus:outline-none
        ${snapshot.matches('idle') ? "caret-transparent pointer-events-none": ""}
        `} onMouseDown={handleMouseDown} onClick={handleClick} onFocusOut={handleFocusOut}
          onInput={(e) => (props.note.body = e.target.value, props.updateNote(props.note))}>
        {note.body}
      </textarea>
    </div>
  );
};

export default Text;
