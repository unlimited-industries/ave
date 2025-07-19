import axios from "axios";

const createFile = async (file) => {
  const response = await axios.post("/files", file, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

const deleteFile = async (fileId) => {
  await axios.delete(`/files/${fileId}`);
};

export { createFile, deleteFile };
