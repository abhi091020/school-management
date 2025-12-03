import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import Navbar from "../components/admin/Navbar";
import Sidebar from "../components/admin/Sidebar";
import IdlePopup from "../components/common/IdlePopup";
import { ADMIN_SIDEBAR_SECTIONS } from "../constants/constants";
import useInactivityLogout from "../hooks/useInactivityLogout";
import { logout } from "../store/authSlice";

export default function AdminLayout() {
  const dispatch = useDispatch();

  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem("admin_sidebar_open");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem("admin_sidebar_open", JSON.stringify(newState));
  };

  const { showPopup, countdown, stayLoggedIn, resetIdleTimer } =
    useInactivityLogout("admin", () => dispatch(logout()));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        isOpen={isOpen}
        setIsOpen={toggleSidebar}
        sections={ADMIN_SIDEBAR_SECTIONS}
        responsive={isMobile}
      />

      <div
        className={`
          flex-1 flex flex-col transition-all duration-500 overflow-y-auto
          ${isMobile ? "ml-0" : isOpen ? "ml-64" : "ml-16"}
        `}
        onScroll={resetIdleTimer}
      >
        <div className="sticky top-0 z-40">
          <Navbar toggleSidebar={toggleSidebar} />
        </div>

        <div
          className="p-6 md:p-8"
          onMouseMove={resetIdleTimer}
          onKeyDown={resetIdleTimer}
        >
          {/* 👈 FIX APPLIED: Increased width to accommodate the wide dashboard design */}
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </div>
      </div>

      <IdlePopup
        open={showPopup}
        countdown={countdown}
        onClose={stayLoggedIn}
        onLogout={() => dispatch(logout())}
      />
    </div>
  );
}
