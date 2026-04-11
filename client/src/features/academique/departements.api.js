import axiosInstance from "@/lib/axios";

export const fetchDepartements = async (params = {}) => {
  const response = await axiosInstance.get("/departements", { params });
  return response.data;
};

export const createDepartementApi = async (data) => {
  const response = await axiosInstance.post("/departements", data);
  return response.data;
};

export const updateDepartementApi = async (id, data) => {
  const response = await axiosInstance.put(`/departements/${id}`, data);
  return response.data;
};

export const toggleDepartementStatusApi = async (id) => {
  const response = await axiosInstance.patch(
    `/departements/${id}/toggle-status`,
  );
  return response.data;
};