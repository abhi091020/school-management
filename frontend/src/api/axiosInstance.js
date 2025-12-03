import axios from "axios";

// ============================================================================
// PRODUCTION-SAFE BASE URL
// ============================================================================
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://school-management-production-0432.up.railway.app";

console.log("%c[AXIOS] Base URL = " + API_BASE_URL, "color: green;");

// Global refresh state
let isRefreshing = false;
let failedQueue = [];

// ============================================================================
// QUEUE PROCESSOR FOR REFRESH
// ============================================================================
const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

// ============================================================================
// CREATE AXIOS INSTANCE
// ============================================================================
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================================
// REQUEST INTERCEPTOR — Attach JWT Automatically
// ============================================================================
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

// ============================================================================
// RESPONSE INTERCEPTOR — Auto Refresh Token
// ============================================================================
axiosInstance.interceptors.response.use(
  (response) => {
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

    // If store or request missing — don't retry
    if (!store || !originalRequest) return Promise.reject(error);

    // ========================================================================
    // TOKEN EXPIRED → REFRESH TOKEN FLOW
    // ========================================================================
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Queue while refreshing
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
        const refreshURL = `${API_BASE_URL}/api/auth/refresh`;

        const res = await axios.post(refreshURL, {}, { withCredentials: true });

        const newToken = res.data?.accessToken || res.data?.token;
        const newUser = res.data?.user;

        if (!newToken)
          throw new Error("Refresh token did not return new token");

        store.dispatch({ type: "auth/setToken", payload: newToken });
        if (newUser) store.dispatch({ type: "auth/setUser", payload: newUser });

        axiosInstance.defaults.headers.common.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        store.dispatch({ type: "auth/logout" });
        window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ========================================================================
    // SESSION INVALID (403/419) → FORCE LOGOUT
    // ========================================================================
    if (status === 403 || status === 419) {
      store.dispatch({ type: "auth/logout" });
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// Debug
window.__AXIOS_INSTANCE__ = axiosInstance;

export default axiosInstance;
