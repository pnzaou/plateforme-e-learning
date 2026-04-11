import axiosInstance from "@/lib/axios";

export const fetchModules = async (params = {}) => {
  const response = await axiosInstance.get("/modules", { params });
  return response.data;
};

export const fetchModuleByIdApi = async (id) => {
  const response = await axiosInstance.get(`/modules/${id}`);
  return response.data;
};

export const createModuleApi = async (data) => {
  const response = await axiosInstance.post("/modules", data);
  return response.data;
};

export const updateModuleApi = async (id, data) => {
  const response = await axiosInstance.put(`/modules/${id}`, data);
  return response.data;
};

export const soumettreModuleApi = async (id) => {
  const response = await axiosInstance.patch(`/modules/${id}/soumettre`);
  return response.data;
};

export const approuverModuleApi = async (id) => {
  const response = await axiosInstance.patch(`/modules/${id}/approuver`);
  return response.data;
};

export const rejeterModuleApi = async (id, motif) => {
  const response = await axiosInstance.patch(`/modules/${id}/rejeter`, {
    motif,
  });
  return response.data;
};

export const archiverModuleApi = async (id) => {
  const response = await axiosInstance.patch(`/modules/${id}/archiver`);
  return response.data;
};

export const deleteModuleApi = async (id) => {
  const response = await axiosInstance.delete(`/modules/${id}`);
  return response.data;
};