import axiosInstance from "@/lib/axios";

export const fetchUsers = async (params = {}) => {
  const response = await axiosInstance.get("/users", { params });
  return response.data;
};

export const createUserApi = async (data) => {
  const response = await axiosInstance.post("/users", data);
  return response.data;
};

export const updateUserApi = async (id, data) => {
  const response = await axiosInstance.put(`/users/${id}`, data);
  return response.data;
};

export const toggleUserStatusApi = async (id) => {
  const response = await axiosInstance.patch(`/users/${id}/toggle-status`);
  return response.data;
};

export const fetchUserDetailsApi = async (id) => {
  const response = await axiosInstance.get(`/users/${id}/details`);
  return response.data;
};