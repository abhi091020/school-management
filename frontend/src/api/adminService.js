import axiosInstance from "./axiosInstance";

/**
 * ====================================================================
 * ADMIN SERVICE — CONTRACT SAFE WITH BACKEND
 * ====================================================================
 */
const adminService = {
  /* =========================================================================
     USERS — LIST & FETCH
  ========================================================================= */
  getUsers: async (params = {}) => {
    // 🚨 FIX APPLIED HERE: Changed from "/api/admin/users" to "/api/admin/users/list"
    const res = await axiosInstance.get("/api/admin/users/list", { params });
    return {
      users: Array.isArray(res.data?.data) ? res.data.data : [],
      pagination: res.data?.pagination || null,
    };
  },

  getUserById: async (id) => {
    if (!id) throw new Error("User ID is required for getUserById");
    const res = await axiosInstance.get(`/api/admin/users/${id}`);
    return res.data?.data || null;
  },

  /* =========================================================================
     USERS — CREATE
  ========================================================================= */
  addUser: async (payload, type) => {
    if (!payload || Object.keys(payload).length === 0) {
      throw new Error("Payload is required for addUser");
    }

    const role = type?.toLowerCase();

    switch (role) {
      case "student": {
        if (!payload.user || !payload.student || !payload.parent) {
          throw new Error(
            "Payload must include 'user', 'student', and 'parent' objects for student creation"
          );
        }
        const res = await axiosInstance.post(
          "/api/admin/users/students",
          payload
        );
        return res.data?.data || null;
      }

      case "teacher":
      case "admin": {
        // Note: Backend maps /api/admin/users/employees to userController.createUser via alias
        const res = await axiosInstance.post(
          "/api/admin/users/employees",
          payload
        );
        return res.data?.data || null;
      }
      // Assuming you might add a standalone parent later:
      // case "parent": {
      //   const res = await axiosInstance.post("/api/admin/users/parents", payload);
      //   return res.data?.data || null;
      // }

      default:
        throw new Error(`Unsupported user type: ${type}`);
    }
  },

  /* =========================================================================
     USERS — UPDATE
  ========================================================================= */
  updateUser: async (id, payload, type) => {
    if (!id) throw new Error("User ID is required for updateUser");
    if (!payload || Object.keys(payload).length === 0) {
      throw new Error("Payload is required for updateUser");
    }

    const role = type?.toLowerCase();

    if (role === "student") {
      // NOTE: This route should use the student profile ID, not the user ID,
      // but keeping it mapped to the endpoint that handles student updates by ID
      const res = await axiosInstance.put(
        `/api/admin/users/students/${id}`,
        payload
      );
      return res.data?.data || null;
    }

    const res = await axiosInstance.put(`/api/admin/users/${id}`, payload);
    return res.data?.data || null;
  },

  /* =========================================================================
     USERS — DELETE
  ========================================================================= */
  deleteUser: async (id) => {
    if (!id) throw new Error("User ID is required for deleteUser");
    const res = await axiosInstance.delete(`/api/admin/users/${id}`);
    return res.data?.data || null;
  },

  bulkDeleteUsers: async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("IDs array is required for bulkDeleteUsers");
    }
    const res = await axiosInstance.post("/api/admin/users/bulk-delete", {
      ids,
    });
    return res.data?.data || null;
  },

  /* =========================================================================
     CLASS MANAGEMENT
  ========================================================================= */
  getClasses: async () => {
    const res = await axiosInstance.get("/api/admin/classes");
    return {
      classes: Array.isArray(res.data?.data) ? res.data.data : [],
    };
  },

  getClassById: async (id) => {
    if (!id) throw new Error("Class ID is required for getClassById");
    const res = await axiosInstance.get(`/api/admin/classes/${id}`);
    return res.data?.data || null;
  },

  /* =========================================================================
     ATTENDANCE
  ========================================================================= */
  getAttendance: async (filters = {}) => {
    const res = await axiosInstance.get("/api/admin/attendance", {
      params: filters,
    });
    return res.data?.data || [];
  },

  bulkDeleteAttendance: async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("IDs array is required for bulkDeleteAttendance");
    }
    const res = await axiosInstance.post("/api/admin/attendance/bulk-delete", {
      ids,
    });
    return res.data?.data || [];
  },
};

export default adminService;
