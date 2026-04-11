import axiosInstance from "@/lib/axios";

export const getAdminDashboard = async () => {
  const response = await axiosInstance.get("/dashboard/admin");
  return response.data;
};

export const getTeacherDashboard = async () => {
  const response = await axiosInstance.get("/dashboard/teacher");
  return response.data;
};
