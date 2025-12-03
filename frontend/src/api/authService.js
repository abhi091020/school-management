// src/api/authService.js

import axiosInstance from "./axiosInstance.js";

const authService = {
  /* ================= ADMIN LOGIN ================= */
  login: async (payload) => {
    const res = await axiosInstance.post("/api/admin/auth/login", payload, {
      withCredentials: true,
    });
    return res.data;
  },

  /* ================= GET AUTH USER ================= */
  getMe: async () => {
    const res = await axiosInstance.get("/api/admin/auth/me", {
      withCredentials: true,
    });
    return res.data;
  },

  /* ================= LOGOUT ================= */
  logout: async () => {
    const res = await axiosInstance.post(
      "/api/admin/auth/logout",
      {},
      { withCredentials: true }
    );
    return res.data;
  },
};

export default authService;
