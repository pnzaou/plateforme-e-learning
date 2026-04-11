import axiosInstance from "@/lib/axios";

export const fetchChapitresByModule = async (moduleId) => {
  const response = await axiosInstance.get(`/modules/${moduleId}/chapitres`);
  return response.data;
};

export const createChapitreApi = async (moduleId, data) => {
  const response = await axiosInstance.post(
    `/modules/${moduleId}/chapitres`,
    data,
  );
  return response.data;
};

export const updateChapitreApi = async (id, data) => {
  const response = await axiosInstance.put(`/chapitres/${id}`, data);
  return response.data;
};

export const toggleChapitrePublicationApi = async (id) => {
  const response = await axiosInstance.patch(
    `/chapitres/${id}/toggle-publication`,
  );
  return response.data;
};

export const reorderChapitresApi = async (moduleId, items) => {
  const response = await axiosInstance.patch(
    `/modules/${moduleId}/chapitres/reorder`,
    { items },
  );
  return response.data;
};

export const deleteChapitreApi = async (id) => {
  const response = await axiosInstance.delete(`/chapitres/${id}`);
  return response.data;
};