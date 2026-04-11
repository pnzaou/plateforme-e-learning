import axios from "axios";

const apiBaseURL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
});

let isRedirecting = false;

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      const isOnAuthPage =
        window.location.pathname === "/login" ||
        window.location.pathname === "/forgot-password" ||
        window.location.pathname === "/reset-password";

      if (!isRedirecting && !isOnAuthPage) {
        isRedirecting = true;
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
