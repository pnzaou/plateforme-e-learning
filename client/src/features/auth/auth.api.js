import axiosInstance from "@/lib/axios";

export const userLogin = async (payload) => {
  const response = await axiosInstance.post("/auth/login", payload);
  return response.data;
};

export const me = async () => {
  const reponse = await axiosInstance.get("/auth/me");
  return reponse.data;
};

export const userLogout = async () => {
  const reponse = await axiosInstance.post("/auth/logout");
  return reponse.data;
};

export const forgotPassword = async (payload) => {
  const response = await axiosInstance.post("/auth/forgot-password", payload);
  return response.data;
};

export const resetPassword = async (payload) => {
  const response = await axiosInstance.post("/auth/reset-password", payload);
  return response.data;
};

export const changePassword = async (payload) => {
  const response = await axiosInstance.post("/auth/change-password", payload);
  return response.data;
};
