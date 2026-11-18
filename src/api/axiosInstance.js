
// import axios from "axios";

// const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// const axiosInstance = axios.create({
//   baseURL: "",
//   withCredentials: true,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // GLOBAL RESPONSE INTERCEPTOR
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       console.warn("Authentication required or session expired.");
//     }

//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "",
  withCredentials: true,
});

// ======================================
// REQUEST INTERCEPTOR
// Auto-handle Content-Type:
//   - FormData  → browser ko boundary set karne do
//   - JSON body → application/json
// ======================================
axiosInstance.interceptors.request.use((config) => {
  const isFormData = config.data instanceof FormData;

  if (isFormData) {
    // Axios ko boundary khud set karne do
    delete config.headers["Content-Type"];
  } else {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

// ======================================
// RESPONSE INTERCEPTOR
// ======================================
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Authentication required or session expired.");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;