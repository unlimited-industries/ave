import { createSignal, createResource, For, Show, createEffect, untrack, onCleanup } from 'solid-js';
import { useParams } from "@solidjs/router";
import { fetchWorkspace, fetchWorkspaces  } from '../api/workspaces';
import WorkspaceWindow from './WorkspaceWindow';

function checkImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function () {
      resolve(true);
    };
    img.onerror = function () {
      resolve(false);
    };
    img.src = url;
  });
}

const getRandomColor = () => {
  const colors = ["bg-red-500", "bg-green-500", "bg-orange-600", "bg-sky-600", "bg-purple-700"];
  return colors[Math.floor(Math.random() * colors.length)];
}

const WorkspaceList = (props) => {
  let action = props.machine.matches({ idle: { workspaceListShown: 'switching' }}) ? 'move' : 'transfer';
  action = props.action !== undefined ? 'link' : action;
  const pageSize = 7;
  const displayedPagesNumber = 6;
  const params = useParams();
  const workspaceId = params.id;

  const [paginationOptions, setPaginationOptions] = createSignal();
  const [searchOptions, setSearchOptions] = createSignal({ relatedTo: workspaceId });
  const [workspacesResponse] = createResource(() => [paginationOptions(), searchOptions()], async ([paginationOptions, searchOptions]) => {
    if (paginationOptions != undefined) {
      if (searchOptions?.relatedTo == undefined) {
        return (await fetchWorkspaces(paginationOptions, {relatedTo: "0"}));
      }
      const currentWorkspace = await fetchWorkspace(workspaceId);
      if (currentWorkspace?.relatedTo != "0") {
        searchOptions.relatedTo = currentWorkspace.relatedTo;
      }

      return await fetchWorkspaces(paginationOptions, searchOptions);
    }
    return [[], 0];
  });
  const [currentPage, setCurrentPage] = createSignal(1);
  const [areThereImages, setAreThereImages] = createSignal({});
  const [maxPage, setMaxPage] = createSignal();
  const [pages, setPages] = createSignal([]);

  const [isworksoaceWindowShown, setIsworksoaceWindowShown] = createSignal(false);
  const [windowWorkspaceAction, setWindowWorkspaceAction] = createSignal("");
  const [workspace, setWorkspace] = createSignal(undefined);
  const [isLocal, setIsLocal] = createSignal(action !== 'link');
  
  let onAction;
  let localPage = 1;
  let globalPage = 1;
  let isFirst = true;

  if (action == "move") {
    onAction = (event) => {
      window.location.href = `/${event.currentTarget.dataset.value}`;
    };
  } else if (action == "transfer") {
    onAction = (event) => {
      props.send({ type: 'SELECT_WS', workspaceId: event.currentTarget.dataset.value });
      props.send({ type: 'CLOSE'});
    }
  } else if (action == 'link') {
    onAction = (event) => {
      props.action(event.currentTarget.dataset.value);
    }
  }

  const checkWorkspaceImage = (fileId) => {
    if (fileId) {
      const imageUrl = `${import.meta.env.VITE_SERVER_URL}/files/${fileId}`;
      checkImage(imageUrl).then((isThereImage) => {
        setAreThereImages((prev) => ({ ...prev, [fileId]: isThereImage }));
      });
    }
  }

  createEffect(() => {
    setPaginationOptions({
      offset: (currentPage() - 1) * pageSize,
      limit: pageSize
    });
  });

  createEffect(() => {
    if (workspacesResponse()) {
      if (workspacesResponse()[0].length == 0 && isLocal() && isFirst) setIsLocal((localPage = currentPage(), setCurrentPage(globalPage), isFirst = false));

      setMaxPage(Math.trunc((workspacesResponse()[1] - 1) / pageSize) + 1)
      const firstPage = (Math.floor((currentPage() - 1) / displayedPagesNumber)) * displayedPagesNumber;
      setPages(Array.from({ length: Math.min(displayedPagesNumber, untrack(maxPage) - firstPage) }, (_, i) => firstPage + i + 1));
    }
  })

  const handlePageButtonClick = (event) => {
    const pageText = event.target.textContent;
    if (pageText == "⭢") {
      const firstPage = (Math.floor((currentPage() - 1) / displayedPagesNumber) + 1) * displayedPagesNumber + 1;
      setCurrentPage(firstPage);
    } else if (pageText == "⭠") {
      const firstPage = (Math.floor((currentPage() - 1) / displayedPagesNumber) - 1) * displayedPagesNumber + 1;
      setCurrentPage(firstPage);
    } else {
      setCurrentPage(parseInt(pageText));
    }
  };

  createEffect(() => {
    if (isLocal()) {
      setSearchOptions({
        relatedTo: workspaceId
      });
    } else {
      setSearchOptions(undefined);
    }
  })

  const handleScopeSwitcher = (event) => {
    if (event.target.textContent == "Global") {
      localPage = currentPage();
      setCurrentPage(globalPage);
      setIsLocal(false);
    } else {
      globalPage = currentPage();
      setCurrentPage(localPage);
      setIsLocal(true);
    }
  }

  // document.addEventListener('keypress', (event) => {
  //   if (event.key === 'l') {
  //     handleScopeSwitcher({ target: { textContent: isLocal() ? 'Global' : 'Local' }})
  //   }
  //   if (/\d/.test(event.key)) {
  //     setCurrentPage(Math.min(maxPage() || 1, event.key));
  //   }
  // });

  return (
    <>
      <div class="relative flex bg-zinc-800 h-3/4 w-3/4 px-2 pb-2 items-start flex-col border border-gray-600 rounded-md">
        <div class="flex w-full justify-between">
          <button class="text-gray-200 text-lg p-1" onClick={() => props.close !== undefined ? props.close() : props.send({ type: 'CLOSE'})}>×</button>
          <div class="p-2">
            <button class={`text-sky-100 border-l border-y text-xs border-zinc-700 ${isLocal() ? "bg-zinc-700": ""}
              rounded-s-md w-32 h-3/4`} onClick={handleScopeSwitcher}>Local</button>
            <button class={`text-sky-100 text-xs border-r border-y border-zinc-700 ${!isLocal() ? "bg-zinc-700": ""}
              rounded-e-md w-32 h-3/4`} onClick={handleScopeSwitcher}>Global</button>
          </div>
          <div></div>
        </div>
        <Show when={isworksoaceWindowShown()}>
          <div class='absolute flex items-center justify-center w-full h-full -ml-2 z-10' onClick={e => setIsworksoaceWindowShown(e.target != e.currentTarget)}>
            <WorkspaceWindow workspace={workspace()} action={windowWorkspaceAction()} machine={props.machine} isLocal={isLocal()} workspaceId={workspaceId}
              show={setIsworksoaceWindowShown} updateWorkspaceList={() => (setCurrentPage(untrack(currentPage) + 1), setCurrentPage(untrack(currentPage) -1))}></WorkspaceWindow>
          </div>
        </Show>
        <div class="flex-grow grid grid-cols-4 grid-rows-2 gap-4 h-96 w-full rounded-md p-10">
          <For each={(workspacesResponse() || [])?.at(0)}>{(workspace) => {
            createEffect(() => {
              checkWorkspaceImage(workspace.fileId);
            });
            return (
              <button onClick={onAction} data-value={workspace.id} class="relative flex border items-center justify-center overflow-clip border-[#3a3a3b] rounded-md h-4/5">
                <div class="flex relative w-full h-full items-center justify-center">
                  <Show
                    when={areThereImages()[workspace.fileId]}
                    fallback={<div class={`w-full h-full ${getRandomColor()}`}></div>}>
                      <img class="max-h-full max-w-full" src={`${import.meta.env.VITE_SERVER_URL}/files/${workspace.fileId}`}></img>
                  </Show>
                  <div class='absolute top-0 left-full -ml-6 bg-transparent p-1 w-6' onClick={
                    e => {
                      e.stopPropagation();
                      setWorkspace(workspace);
                      setWindowWorkspaceAction("update");
                      setIsworksoaceWindowShown(true);
                    }
                  }>
                    <img class="w-full h-full mix-blend-color-dodge" src='src/assets/edit.png'></img>
                  </div>
                </div>

                <div class="flex p-2 bg-zinc-700 h-6 items-center w-full justify-between absolute bottom-0 left-0">
                  <p class="text-sky-100 font-mono">{workspace.name}</p>
                </div>
              </button>
            )
          }}
          </For>
          <div class="add-workspace border border-[#414143] border-dashed rounded-md h-4/5 flex items-center justify-center">
            <button onClick={ () => (setWindowWorkspaceAction("create"), setIsworksoaceWindowShown(true)) } class="flex items-center justify-center w-full h-full">
              <img src="src/assets/add-ws.svg" class="add-workspace-icon" alt="Add workspace"/>
            </button>
          </div>
        </div>
        <div class="flex h-12 w-full items-center justify-center">
          <Show when={currentPage() > displayedPagesNumber}>
            <button onClick={handlePageButtonClick} class="workspace-page-btn bg-sky-300 py-1 text-sky-900 text-2xl rounded-md mx-1 w-8">
              ⭠
            </button>
            <button onClick={handlePageButtonClick} class="workspace-page-btn py-2 text-white bg-sky-800 rounded-lg mx-1 w-8">
              1
            </button>
            <div class='h-full align-text-bottom flex items-center mx-1'>
              <p class='text-white pt-4'>...</p>
            </div>
          </Show>
          <For each={pages()}>{(page) => 
            <button onClick={handlePageButtonClick} class={`${currentPage() == page ? 'border border-sky-500' : ''} workspace-page-btn py-2 text-white bg-sky-800 rounded-lg mx-1 w-8`}>{page}</button>
          }
          </For>
          <Show when={maxPage() > (Math.trunc((currentPage() - 1) / displayedPagesNumber) + 1) * displayedPagesNumber}>
            <button onClick={handlePageButtonClick} class="workspace-page-btn bg-sky-300 py-1 text-sky-900 text-2xl rounded-md mx-1 w-8">
              ⭢
            </button>
          </Show>
        </div>
      </div>
    </>
  );
};

export default WorkspaceList;
