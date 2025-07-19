import { useActor } from "@xstate/solid";
import { textMachine } from "../machines/content-machines";

const Link = (props) => {
  const note = props.note;
  const [snapshot, send, actorRef] = useActor(textMachine);
  props.machine.send({ type: "ADD_MACHINE", machine: actorRef, snapshot: snapshot });
  let link;
  let isOutside = false;

  const handleInput = (e) => {  
    note.body = e.target.textContent;
    props.updateNote(note);
  };

  const handleMouseDown = () => {
    if (!snapshot.matches({ typing: 'typing'})) {
      isOutside = false;
      link.blur();
    }
  }

  const handleClick = (e) => {
    if (!e.metaKey && !e.ctrlKey) {
      link.focus();
      e.preventDefault();
    } else if (e.metaKey) {
      e.preventDefault();
      window.open(props.note.body, "_blank");
    }
  }

  const handleBlur = () => {
    if (isOutside) {
      const selection = window.getSelection();
      selection.removeAllRanges(); 
    }
    isOutside = true;
    send({type: 'CANCEL'});
  }

  const handleMouseUp = () => {
    isOutside = false;
    link.blur();
  }

  return (
    <div class="bg-[#252525] w-full h-full" onMouseUp={handleMouseUp}>
      <div class="p-3">
        <a ref={link}
          onBLur={handleBlur}
          onInput={handleInput}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          href={note.body}
          contentEditable="true"
          class={`px-3 w-full block text-blue-500 underline focus:outline-none caret-zinc-400 cursor-text select-none
          ${snapshot.matches('idle') ? "caret-transparent pointer-events-none": ""}`}
        >
          {note.body}
        </a>
      </div>
    </div>
  );
};

export default Link;
