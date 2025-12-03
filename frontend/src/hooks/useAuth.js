// src/hooks/useAuth.js
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import authService from "../api/authService";
import { setUser, logout } from "../store/authSlice";

/**
 * Centralized auth/session hook
 * - Relies on token in Redux
 * - Uses refresh-token (via axios interceptor) when /me returns 401
 * - Fetches user profile once when needed
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // No token → no session
        if (!token) {
          setChecking(false);
          return;
        }

        // Already have user → trust Redux; no need to hit /me every time
        if (user) {
          setChecking(false);
          return;
        }

        // Fetch current user from backend
        const res = await authService.getMe();

        if (res?.success && res?.user) {
          dispatch(setUser(res.user));
        } else {
          dispatch(logout());
        }
      } catch (err) {
        // If refresh-token flow fails, axios interceptor will already have logged out
        dispatch(logout());
      } finally {
        setChecking(false);
      }
    };

    init();
  }, [token, user, dispatch]);

  return {
    user,
    token,
    isAuthenticated,
    checking,
  };
};
