import axios from "axios";

// ============================================================================
// 1. ENVIRONMENT-SAFE BASE URL (LOCAL + PRODUCTION)
// ============================================================================
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://school-management-m8c5.onrender.com";

console.log(
  `%c[AXIOS] Base URL => ${API_BASE_URL}`,
  "color: #22c55e; font-weight: bold;"
);

// ============================================================================
// 2. GLOBAL REFRESH STATE + QUEUE
// ============================================================================
let isRefreshing = false;
let failedQueue = [];

// Process queued requests after refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

// ============================================================================
// 3. CREATE AXIOS INSTANCE (with optimized defaults)
// ============================================================================
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000, // Prevent hanging requests
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ============================================================================
// 4. REQUEST INTERCEPTOR — Attach JWT Automatically
// ============================================================================
axiosInstance.interceptors.request.use(
  (config) => {
    const store = window.__APP_STORE__;
    const token = store?.getState()?.auth?.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================================
// 5. RESPONSE INTERCEPTOR — Refresh Token Logic
// ============================================================================
axiosInstance.interceptors.response.use(
  (response) => {
    // Backend may send a new token
    const newToken = response.headers["x-new-access-token"];
    const store = window.__APP_STORE__;

    if (newToken && store) {
      store.dispatch({ type: "auth/setToken", payload: newToken });
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    }

    return response;
  },

  async (error) => {
    const store = window.__APP_STORE__;
    if (!error?.response || !store) return Promise.reject(error);

    const originalRequest = error.config;
    const { status } = error.response;

    // -------------------------------
    // 401 Unauthorized → Attempt Refresh
    // -------------------------------
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Queue request if refresh already running
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

        if (!newToken) throw new Error("No access token returned");

        store.dispatch({ type: "auth/setToken", payload: newToken });
        if (newUser) store.dispatch({ type: "auth/setUser", payload: newUser });

        axiosInstance.defaults.headers.common.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err, null);

        store.dispatch({ type: "auth/logout" });
        window.location.assign("/auth/login");

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // -------------------------------
    // 403 / 419 → Session expired
    // -------------------------------
    if (status === 403 || status === 419) {
      store.dispatch({ type: "auth/logout" });
      window.location.assign("/auth/login");
    }

    return Promise.reject(error);
  }
);

// Debugging shortcut
window.__AXIOS__ = axiosInstance;

export default axiosInstance;
