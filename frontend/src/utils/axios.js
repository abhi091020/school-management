import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  withCredentials: true, // send cookies if used for auth
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: add interceptors for token refresh or error handling
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // global error handling
    return Promise.reject(error);
  }
);

export default instance;
