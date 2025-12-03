// src/api/authService.js

import api from "./axiosInstance";

// ============================================================================
// Clean, standardized, enterprise-grade Auth Service
// ============================================================================

const authService = {
  /* ================= ADMIN LOGIN ================= */
  login: async (payload) => {
    const res = await api.post("/api/admin/auth/login", payload);
    return res.data;
  },

  /* ================= GET AUTH USER ================= */
  getMe: async () => {
    const res = await api.get("/api/admin/auth/me");
    return res.data;
  },

  /* ================= LOGOUT ================= */
  logout: async () => {
    const res = await api.post("/api/admin/auth/logout");
    return res.data;
  },
};

export default authService;
