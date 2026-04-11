import axiosInstance from "@/lib/axios";

export const fetchFilieres = async (params = {}) => {
  const response = await axiosInstance.get("/filieres", { params });
  return response.data;
};

export const createFiliereApi = async (data) => {
  const response = await axiosInstance.post("/filieres", data);
  return response.data;
};

export const updateFiliereApi = async (id, data) => {
  const response = await axiosInstance.put(`/filieres/${id}`, data);
  return response.data;
};

export const toggleFiliereStatusApi = async (id) => {
  const response = await axiosInstance.patch(`/filieres/${id}/toggle-status`);
  return response.data;
};