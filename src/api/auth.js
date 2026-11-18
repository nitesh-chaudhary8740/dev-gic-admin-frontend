
import axiosInstance from "./axiosInstance";

// Admin Login
export const loginAdmin = async (credentials) => {
  const response = await axiosInstance.post(
    "/api/admin/auth/login",
    credentials
  );

  return response.data;
};

// Get Current Logged-in Admin
export const getCurrentAdmin = async () => {
  const response = await axiosInstance.get(
    "/api/admin/auth/me"
  );

  return response.data;
};

// Admin Logout
export const logoutAdmin = async () => {
  const response = await axiosInstance.post(
    "/api/admin/auth/logout"
  );

  return response.data;
};
