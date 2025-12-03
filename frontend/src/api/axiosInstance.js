import axios from "axios";

// ============================================================================
// 1. ENVIRONMENT-SAFE BASE URL (LOCAL + PRODUCTION)
// ============================================================================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

console.log(
  `%c[AXIOS] Base URL => ${API_BASE_URL}`,
  "color: #22c55e; font-weight: bold;"
);

// ============================================================================
// 2. GLOBAL REFRESH STATE + QUEUE
// ============================================================================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

// ============================================================================
// 3. CREATE AXIOS INSTANCE
// ============================================================================
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ============================================================================
// 4. REQUEST INTERCEPTOR — Attach JWT
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
// 5. RESPONSE INTERCEPTOR — Token Refresh
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
    const store = window.__APP_STORE__;
    if (!error?.response || !store) return Promise.reject(error);

    const originalRequest = error.config;
    const { status } = error.response;

    // -------------------------------
    // 401 Unauthorized → Attempt Refresh
    // -------------------------------
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

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
        const res = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = res.data?.accessToken;
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

        // IMPORTANT FIX
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

window.__AXIOS_INSTANCE__ = axiosInstance;

export default axiosInstance;
