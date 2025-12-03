// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: import.meta.env.MODE === "development",
});

// *************** CRITICAL FIX ***************
if (typeof window !== "undefined") {
  window.__APP_STORE__ = store;
}
// ********************************************

export default store;
