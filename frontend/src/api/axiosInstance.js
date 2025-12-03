// frontend/utils/axiosInstance.js

import axios from "axios";

// Global flags
let isRefreshing = false;
let failedQueue = [];

/**************************************************************
 * PROCESS QUEUED REQUESTS DURING REFRESH
 **************************************************************/
const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

/**************************************************************
 * CREATE AXIOS INSTANCE
 **************************************************************/
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**************************************************************
 * REQUEST INTERCEPTOR — Attach JWT if available
 **************************************************************/
axiosInstance.interceptors.request.use(
  (config) => {
    const store = window.__APP_STORE__;

    if (store) {
      const token = store.getState()?.auth?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    config.withCredentials = true;
    return config;
  },
  (error) => Promise.reject(error)
);

/**************************************************************
 * RESPONSE INTERCEPTOR — Auto Refresh Logic
 **************************************************************/
axiosInstance.interceptors.response.use(
  (response) => {
    // Backend may send token rotation header
    const newToken = response.headers["x-new-access-token"];
    const store = window.__APP_STORE__;

    if (newToken && store) {
      store.dispatch({ type: "auth/setToken", payload: newToken });
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    }

    return response;
  },

  async (error) => {
    if (!error || !error.response) return Promise.reject(error);

    const store = window.__APP_STORE__;
    const originalRequest = error.config;
    const status = error.response.status;

    if (!store || !originalRequest) return Promise.reject(error);

    /**************************************************************
     * 1. ACCESS TOKEN EXPIRED → TRY REFRESH
     **************************************************************/
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If already refreshing → queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const refreshURL = `${
          import.meta.env.VITE_API_BASE_URL
        }/api/auth/refresh`;

        // PUBLIC + ADMIN use same refresh flow (server auto-detects role)
        const res = await axios.post(refreshURL, {}, { withCredentials: true });

        // Backend returns { accessToken, token, user }
        const newToken = res.data?.accessToken || res.data?.token || null;

        const newUser = res.data?.user || null;

        if (!newToken) throw new Error("Refresh did not provide new token");

        // Update Redux store
        store.dispatch({ type: "auth/setToken", payload: newToken });
        if (newUser) store.dispatch({ type: "auth/setUser", payload: newUser });

        // Set axios defaults
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${newToken}`;

        // Resume queued requests
        processQueue(null, newToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Hard logout on refresh failure
        store.dispatch({ type: "auth/logout" });
        window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    /**************************************************************
     * 2. SESSION INVALID / FORCE LOGOUT
     *    403 → refresh token revoked
     *    419 → session expired
     **************************************************************/
    if (status === 403 || status === 419) {
      store.dispatch({ type: "auth/logout" });
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

/**************************************************************
 * DEBUG ACCESS (Development Only)
 **************************************************************/
window.__AXIOS_INSTANCE__ = axiosInstance;

export default axiosInstance;
