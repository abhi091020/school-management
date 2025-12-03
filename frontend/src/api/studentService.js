// frontend/src/api/studentService.js

import axiosInstance from "./axiosInstance";
import { formatQueryParams } from "../utils/urlUtils";

/* ===========================================================
   GET STUDENTS (Pagination + Filtering + Search)
=========================================================== */
export const getStudents = async (params = {}) => {
  try {
    // Always enforce role=STUDENT
    const queryString = formatQueryParams({ role: "STUDENT", ...params });
    const query = queryString ? `?${queryString}` : "";

    const res = await axiosInstance.get(`/api/admin/users${query}`);

    // Backend: { success, message, data: { users, totalUsers, ... } }
    return res.data.data; // return whole { users, totalUsers, totalPages ... }
  } catch (error) {
    console.error("Failed to fetch students:", error);
    throw error.response?.data || error.message;
  }
};

/* ===========================================================
   CREATE STUDENT (Flat Payload)
=========================================================== */
export const createStudent = async (payload) => {
  try {
    const res = await axiosInstance.post("/api/admin/users/students", payload);

    // Backend: { success, message, data: { user, profile, admissionNumber } }
    return res.data.data;
  } catch (error) {
    console.error("Failed to create student:", error);
    throw error.response?.data || error;
  }
};

/* ===========================================================
   UPDATE STUDENT
   (Only updates USER model via PUT /users/:id)
=========================================================== */
export const updateStudent = async (userId, payload) => {
  try {
    const res = await axiosInstance.put(`/api/admin/users/${userId}`, payload);

    // Backend: { success, message, data: updatedUser }
    return res.data.data;
  } catch (error) {
    console.error(`Failed to update student ${userId}:`, error);
    throw error.response?.data || error;
  }
};

/* ===========================================================
   DELETE STUDENT (Soft Delete)
=========================================================== */
export const deleteStudent = async (userId) => {
  try {
    const res = await axiosInstance.delete(`/api/admin/users/${userId}`);
    return res.data.data; // { success: true }
  } catch (error) {
    console.error(`Failed to delete student ${userId}:`, error);
    throw error.response?.data || error;
  }
};

/* ===========================================================
   GET CLASSES (for student form)
=========================================================== */
export const getClasses = async () => {
  try {
    const res = await axiosInstance.get("/api/admin/classes");

    // Backend: { success, data: [ ...classes ] }
    const classes = res.data?.data || res.data?.classes || [];
    return Array.isArray(classes) ? classes : [];
  } catch (error) {
    console.error("Failed to load classes:", error);
    throw error.response?.data || error.message;
  }
};
