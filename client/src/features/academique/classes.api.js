import axiosInstance from "@/lib/axios";

export const fetchClasses = async (params = {}) => {
  const response = await axiosInstance.get("/classes", { params });
  return response.data;
};

export const createClasseApi = async (data) => {
  const response = await axiosInstance.post("/classes", data);
  return response.data;
};

export const updateClasseApi = async (id, data) => {
  const response = await axiosInstance.put(`/classes/${id}`, data);
  return response.data;
};

export const deleteClasseApi = async (id) => {
  const response = await axiosInstance.delete(`/classes/${id}`);
  return response.data;
};