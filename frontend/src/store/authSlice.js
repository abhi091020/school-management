// src/store/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const USER_KEY = "AUTH_USER";
const TOKEN_KEY = "AUTH_TOKEN";

/* ===========================================================
   Attach Token to Axios (Handles Late Initialization)
=========================================================== */
const setAxiosAuthHeader = (token) => {
  const applyHeader = () => {
    const axiosInstance = window.__AXIOS_INSTANCE__;
    if (!axiosInstance) return false;

    if (token) {
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;
    } else {
      delete axiosInstance.defaults.headers.common["Authorization"];
    }

    return true;
  };

  // If axios instance isn’t ready yet → retry every 200ms
  if (!applyHeader()) {
    let retries = 10;
    const interval = setInterval(() => {
      if (applyHeader() || --retries <= 0) clearInterval(interval);
    }, 200);
  }
};

/* ===========================================================
   Safe LocalStorage Utilities
=========================================================== */
const loadJSON = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const loadString = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

/* ===========================================================
   Initial State
=========================================================== */
const initialState = {
  user: loadJSON(USER_KEY),
  token: loadString(TOKEN_KEY),
  isAuthenticated: !!loadString(TOKEN_KEY),
};

// Attach token to axios on boot
setAxiosAuthHeader(initialState.token);

/* ===========================================================
   Slice
=========================================================== */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /* -------------------------------------------------------
       Direct Token Update (refresh token flow)
    -------------------------------------------------------- */
    setToken: (state, action) => {
      const token = action.payload;

      state.token = token;
      state.isAuthenticated = !!token;

      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }

      setAxiosAuthHeader(token);
    },

    /* -------------------------------------------------------
       Store user object (login + refresh)
    -------------------------------------------------------- */
    setUser: (state, action) => {
      const user = action.payload;

      state.user = user;

      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    },

    /* -------------------------------------------------------
       Combined login handler
       (Used after successful login)
    -------------------------------------------------------- */
    setAuth: (state, action) => {
      const { user, token } = action.payload;

      state.user = user;
      state.token = token;
      state.isAuthenticated = true;

      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_KEY, token);

      setAxiosAuthHeader(token);
    },

    /* -------------------------------------------------------
       Logout (Clear everything)
    -------------------------------------------------------- */
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);

      setAxiosAuthHeader(null);
    },
  },
});

export const { setAuth, setToken, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
