import axiosInstance from "@/lib/axios";

export const fetchContenusByChapitre = async (chapitreId) => {
  const response = await axiosInstance.get(
    `/chapitres/${chapitreId}/contenus`,
  );
  return response.data;
};

export const createContenuApi = async (chapitreId, data) => {
  const response = await axiosInstance.post(
    `/chapitres/${chapitreId}/contenus`,
    data,
  );
  return response.data;
};

export const updateContenuApi = async (id, data) => {
  const response = await axiosInstance.put(`/contenus/${id}`, data);
  return response.data;
};

export const toggleContenuPublicationApi = async (id) => {
  const response = await axiosInstance.patch(
    `/contenus/${id}/toggle-publication`,
  );
  return response.data;
};

export const reorderContenusApi = async (chapitreId, items) => {
  const response = await axiosInstance.patch(
    `/chapitres/${chapitreId}/contenus/reorder`,
    { items },
  );
  return response.data;
};

export const deleteContenuApi = async (id) => {
  const response = await axiosInstance.delete(`/contenus/${id}`);
  return response.data;
};

// Demande une signature pour upload direct → Cloudinary
export const getUploadSignatureApi = async (type, moduleId) => {
  const response = await axiosInstance.post("/upload/signature", {
    type,
    moduleId,
  });
  return response.data;
};