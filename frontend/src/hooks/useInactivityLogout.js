import { useEffect, useState, useRef } from "react";
import axios from "../utils/axios";
import { ROLES } from "../constants/constants";

export default function useInactivityLogout(role = ROLES.ADMIN, logoutUser) {
  const [showPopup, setShowPopup] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const activityTimer = useRef();
  const warningTimer = useRef();
  const countdownInterval = useRef();

  const ADMIN_TIMEOUT = 15 * 60 * 1000; // 15 min
  const USER_TIMEOUT = 10 * 60 * 1000; // 10 min
  const POPUP_TIME = 2 * 60 * 1000; // Show popup 2 min before logout

  const timeout = role === ROLES.ADMIN ? ADMIN_TIMEOUT : USER_TIMEOUT;

  const resetTimers = () => {
    clearTimeout(activityTimer.current);
    clearTimeout(warningTimer.current);
    clearInterval(countdownInterval.current);

    setShowPopup(false);
    setCountdown(0);

    // Show warning popup 2 min before logout
    warningTimer.current = setTimeout(() => {
      setShowPopup(true);
      setCountdown(Math.floor(POPUP_TIME / 1000));

      countdownInterval.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, timeout - POPUP_TIME);

    // Auto logout at timeout
    activityTimer.current = setTimeout(() => {
      logoutUser();
    }, timeout);
  };

  const stayLoggedIn = async () => {
    try {
      await axios.post(
        "/admin/auth/refresh-token",
        {},
        { withCredentials: true }
      );
      resetTimers();
    } catch (err) {
      logoutUser();
    }
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimers));

    resetTimers();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimers));
      clearTimeout(activityTimer.current);
      clearTimeout(warningTimer.current);
      clearInterval(countdownInterval.current);
    };
  }, []);

  return { showPopup, countdown, stayLoggedIn, resetIdleTimer: resetTimers };
}
