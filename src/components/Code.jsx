import { createStore } from "solid-js/store";
import { For, createSignal, Show, onMount } from "solid-js";
import { splitIntoThreeParts } from "../util/common";
import { useActor } from "@xstate/solid";
import { textMachine } from "../machines/content-machines";

const Code = (props) => {
  let [name, mode, content] = splitIntoThreeParts(props.note.body || '', ';');
  const [tabs, setTabs] = createStore([{ id: 1, name: name || "Tab 1", content: content, isCode: mode != "nocode", isJustAdded: false}]);

  const [snapshot, send, actorRef] = useActor(textMachine);
  props.machine.send({ type: "ADD_MACHINE", machine: actorRef, snapshot: snapshot });

  let textarea;
  let isInside;

  const handleMouseDown = () => {
    if (!snapshot.matches({ typing: 'typing'})) {
      textarea.blur();
    }
  }

  const handleClick = () => {
    textarea.focus();
    textarea.setSelectionRange(textarea.selectionStart, textarea.selectionEnd);
  }

  const handleFocusOut = () => {
    textarea.blur();
    send({ type: 'CANCEL' });
  }

  const handleMouseUp = () => {
    textarea.blur();
  }

  const handleMouseEnter = () => {
    isInside = true;
  }

  const handleMouseLeave = () => {
    isInside = false;
  }

  const handleWheel = (event) => {
    if (event.ctrlKey) return;

    if (isInside) {
      event.stopPropagation();
      if (event.target.scrollLeft === 0 && event.deltaX < 0) {
        event.preventDefault();
      } 
    } 
  }

  const [activeTab, setActiveTab] = createSignal(1);
  const [outputTab, setOutputTab] = createSignal(undefined);
  const [renamedTab, setRenamedTab] = createSignal(-1);

  const runCode = () => {
    try {
      let capturedOutput = "";
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        capturedOutput += args.map(el => JSON.stringify(el, '', 2)).join(" ") + "\n";
        originalConsoleLog(...args);
      };
      
      // eslint-disable-next-line no-eval
      let code = tabs.find(tab => tab.id === activeTab())?.content || "";
      try { 
        eval.call(null, code);
      } catch (e) {
          if (e.toString().startsWith("SyntaxError: await")) {
              code = `(async () => {\n${code}\n})()\n`;
              eval.call(null, code);
          } else {
              throw e;
          }
      }
      console.log = originalConsoleLog;

      if (capturedOutput) {
        if (outputTab() === undefined) {
          const newId = Math.max(...tabs.map(tab => tab.id), 0) + 1;
          setTabs([...tabs, { id: newId, name: `Output`, content: capturedOutput, isCode: false }]);
          setOutputTab(newId);
        } else {
          updateTabContent(outputTab(), capturedOutput);
        }
        setActiveTab(outputTab()); 
      }
    } catch (error) {
      if (outputTab() === undefined) {
        const newId = Math.max(...tabs.map(tab => tab.id), 0) + 1;
        setTabs([...tabs, { id: newId, name: `Output`, content: "Error: " + error.message, isCode: false }]);
        setOutputTab(newId);
      } else {
        updateTabContent(outputTab(), "Error: " + error.message);
      }
      setActiveTab(outputTab());
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tabs.find(tab => tab.id === activeTab())?.content || "");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const switchIscode = () => {
    setTabs(tabs.map(tab => (tab.id === activeTab() ? { ...tab, isCode: !tab.isCode, isJustAdded: false } : tab)));
    if (activeTab() == 1) {
      const tab = tabs.find(tab => tab.id === activeTab());
      props.note.body = tab.name + ';' + (tab.isCode ? "code": "nocode") + ";" + tab.content;
      props.updateNote(props.note);
    }
  }

  const addTab = () => {
    const newId = Math.max(...tabs.map(tab => tab.id), 0) + 1;
    setTabs([...tabs, { id: newId, name: `Tab ${newId}`, content: "", isCode: true, isJustAdded: true }]);
    setActiveTab(newId);
  };

  const removeTab = (id) => (
    () => {
    setTabs(tabs.filter(tab => tab.id !== id));
    if (id == outputTab()) {
      setOutputTab(undefined);
    }
    if (activeTab() === id) {
      setActiveTab(tabs[0]?.id || 1);
    }
  });

  const updateTabContent = (id, content) => {
    setTabs([...tabs.map(tab => (tab.id === id ? { ...tab, content: content, isJustAdded: false } : tab))]);
    if (activeTab() == 1) {
      const tab = tabs.find(tab => tab.id === activeTab());
      props.note.body = tab.name + ';' + (tab.isCode ? "code": "nocode") + ";" + tab.content;
      props.updateNote(props.note);
    }
  };

  const renameTab = (id, newName) => {
    setTabs(tabs.map(tab => (tab.id === id ? { ...tab, name: newName, isJustAdded: false } : tab)));
    if (id == 1) {
      const tab = tabs.find(tab => tab.id === id);
      props.note.body = tab.name + ';' + (tab.isCode ? "code": "nocode") + ";" + tab.content;
      props.updateNote(props.note);
    }
  };

  const handleTabDblClick = (id) => (
    () => {
      setRenamedTab(id);
    }
  );
  
  return (
    <div class="grid grid-cols-12 grid-rows-12 h-full w-full"
      onMouseUp={handleMouseUp}>
      <img src='src/assets/code-field.png' class='absolute -z-10 w-full h-full'/>
      <div class="col-start-2 row-start-2 col-span-10 grid grid-cols-12">
        <img class="absolute -z-10 w-5/6" src='src/assets/tab.png'></img>
        <div class='absolute flex z-10 h-[3%] left-[20.5%] top-[10%] w-[69%] items-start gap-3'>
          <For each={tabs}>{
            (tab) => (
              <div 
                class={`flex-1 min-w-[1%] max-w-[18%] h-[100%] pl-[4%] pr-[4%] pt-[2%] pb-[1.5%] -mt-[1.5%] outline-1 outline outline-[#343434] 
                  ${activeTab() == tab.id ? "bg-gray-800" : ""} 
                  outline-2 text-white font-semibold text-xs rounded-md 
                  skew-x-[35deg] inline-flex items-center
                  ${tab.isJustAdded ? "tab" : ""}`}
                  onClick={(e) => { if (e.target === e.currentTarget) setActiveTab(tab.id) }}
              >
                <Show when={tab.id == renamedTab()} fallback={
                  <span class="skew-x-[-35deg] truncate text-neutral-400" onDblClick={handleTabDblClick(tab.id)}>
                    {`${tab.name}`}
                  </span>
                }>
                  {() => {
                    let inputRef;
                    onMount(() => {
                      inputRef.focus();
                      inputRef.select();
                    });

                    return (
                      <textarea ref={inputRef} class={`skew-x-[-35deg] truncate text-neutral-400 focus:outline-none resize-none bg-transparent h-4 caret-gray-500
                        ${snapshot.matches('idle') ? "caret-transparent pointer-events-none": ""}`} onMouseDown={handleMouseDown} onClick={handleClick}
                        onBlur={(e) => (renameTab(tab.id, e.target.value), setRenamedTab(-1))}
                        onKeydown={(e) => { 
                          if (e.code == 'Enter') (e.preventDefault(), renameTab(tab.id, e.target.value), setRenamedTab(-1));
                          if (e.code == 'Escape') (e.preventDefault(), setRenamedTab(-1))}
                        }>
                        {`${tab.name}`}
                      </textarea>
                    );
                   }}
                </Show>
                <Show when={tab.id !== 1}>
                  <button class="absolute text-neutral-600 right-1 top-0 text-[10px] skew-x-[-35deg] hover:text-gray-300" onClick={removeTab(tab.id)}>✕</button>
                </Show>
              </div>
            )
          }
          </For>
          <Show when={tabs.length < 10}>
            <button class='flex w-[3%] h-[20%] items-center justify-center text-neutral-600 text-[150%]'>
              <p class='inline-block' onClick={addTab}>+</p>
            </button>
          </Show>
        </div>
      </div>
      <div class='absolute w-full h-full grid grid-cols-11 grid-rows-12'>
        <div class="absolute w-full h-full row-start-3 col-start-2 col-span-9 row-span-9 -mt-[2%]">
            <textarea ref={textarea} class={`bg-transparent text-[#9899a3] font-mono focus:outline-none resize-none w-full h-full overflow-scroll whitespace-pre
              ${snapshot.matches('idle') ? "caret-transparent pointer-events-none": ""}`} onMouseDown={handleMouseDown} onClick={handleClick}
              onFocusOut={handleFocusOut} onWheel={handleWheel} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
              value={tabs.find(tab => tab.id === activeTab())?.content || ""}
              onInput={(e) => updateTabContent(activeTab(), e.target.value)}>
            </textarea>
            <div class='absolute top-0 right-0 w-20 items-center flex gap-1 flex-row-reverse'>
            <Show when={tabs.find(tab => tab.id === activeTab())?.isCode} fallback={
              <>
                <button class="w-6 h-6 bg-zinc-700 opacity-80 rounded-md hover:bg-opacity-75" onClick={copyToClipboard}>
                  <img src='src/assets/copy.png' class='opacity-50'></img>
                </button>
              </>
            }>
              <button class="w-6 h-6 bg-zinc-700 opacity-80 rounded-md hover:bg-opacity-75" onClick={switchIscode}>
                  <img src='src/assets/code.png' class='opacity-50'></img>
                </button>
              <button class="w-6 h-6 bg-zinc-700 opacity-80 rounded-md hover:bg-opacity-75" onClick={copyToClipboard}>
                <img src='src/assets/copy.png' class='opacity-50'></img>
              </button>
              <button class="w-6 h-6 bg-zinc-700 opacity-80 rounder-md rounded-md hover:bg-opacity-75" onClick={runCode}>
                  <img src='src/assets/run.png' class='opacity-50'></img>
              </button>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Code;
