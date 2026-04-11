import axiosInstance from "@/lib/axios";

export const fetchNiveaux = async (params = {}) => {
  const response = await axiosInstance.get("/niveaux", { params });
  return response.data;
};

export const createNiveauApi = async (data) => {
  const response = await axiosInstance.post("/niveaux", data);
  return response.data;
};

export const updateNiveauApi = async (id, data) => {
  const response = await axiosInstance.put(`/niveaux/${id}`, data);
  return response.data;
};

export const deleteNiveauApi = async (id) => {
  const response = await axiosInstance.delete(`/niveaux/${id}`);
  return response.data;
};