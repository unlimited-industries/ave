import axios from "axios";

const converToWorkspaceModel = (workspace) => {
  return {
    id: workspace.id,
    name: workspace.name,
    fileId: workspace.file_id,
    relatedTo: workspace.related_to,
  };
};

const convertToWorkspace = (workspace) => {
  return {
    id: workspace.id,
    name: workspace.name,
    file_id: workspace.fileId,
    related_to: workspace.relatedTo
  };
};

const createWorkspace = async (workspace) => {
  const response = await axios.post(
    "/workspaces",
    convertToWorkspace(workspace)
  );
  return response.data;
};

const fetchWorkspace = async(workspace_id) => {
  const response = await axios.get(`/workspaces/${workspace_id}`);
  return response.data != undefined ? converToWorkspaceModel(response.data) : undefined;
}

const fetchWorkspaces = async (paginationOptions, searchOptions) => {
  let filter = `?`;
  if (paginationOptions && !(paginationOptions.offset < 0)) {
    filter += `offset=${paginationOptions.offset}&`;
  }

  if (paginationOptions && !(paginationOptions.limit < 0)) {
    filter += `limit=${paginationOptions.limit}&`;
  }

  if (searchOptions && searchOptions.relatedTo) {
    filter += `relatedTo=${searchOptions.relatedTo}`
  }

  let response = await axios.get("/workspaces" + filter);
  let workspaces = response.data || [];

  return [
    workspaces.map((workspace) => converToWorkspaceModel(workspace)),
    parseInt(response.headers["x-total-count"]),
  ];
};

const updateWorkspace = async (workspace) => {
  await axios.patch(
    `workspaces/${workspace.id}`,
    convertToWorkspace(workspace)
  );
};

export { createWorkspace, fetchWorkspaces, fetchWorkspace, updateWorkspace };
