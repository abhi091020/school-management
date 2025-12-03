import React, { useState, useRef, useEffect } from "react";
import {
  FaBell,
  FaCog,
  FaChevronDown,
  FaSearch,
  FaSignOutAlt,
  FaUserCircle, // Added for fallback avatar icon
} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../store/authSlice";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications] = useState(3);
  const menuRef = useRef();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    localStorage.clear();
    sessionStorage.clear();
    navigate("/auth/login");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Derived State ---
  const path = location.pathname.split("/").filter(Boolean);

  const pageTitle =
    path[1]?.charAt(0).toUpperCase() + path[1]?.slice(1) || "Dashboard";

  const userRole =
    user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) ||
    "Administrator";

  const userName = user?.name || "Admin User";
  const userEmail = user?.email || "admin@learniq.com";

  // --- Component Structure ---
  return (
    <nav className="relative w-full h-16 bg-white/90 backdrop-blur-xl px-6 flex items-center justify-between border-b border-slate-200/80 shadow-md shadow-slate-100/50 overflow-visible">
      {/* Subtle Background Effect for Modern Look */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/20 to-transparent animate-subtleShimmer" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/20 via-transparent to-cyan-50/10 opacity-70" />

      {/* LEFT: Page Title */}
      <div className="relative flex items-center gap-4 group z-10">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 transition-colors duration-300 group-hover:text-blue-600">
              {path[0]?.toUpperCase() || "ADMIN"}
            </p>
          </div>

          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:via-cyan-600 group-hover:to-blue-600 transition-all duration-500">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* RIGHT: Search, Icons & Profile */}
      <div className="relative flex items-center gap-3 z-10">
        {/* Search (Enhanced) */}
        <div
          className={`
            relative flex items-center gap-3 px-4 py-2 rounded-xl
            bg-white/50 border border-slate-200/80 backdrop-blur-md
            transition-all duration-500 ease-out 
            ${
              searchFocused
                ? "w-80 shadow-lg ring-2 ring-blue-500/50 border-blue-400 bg-white"
                : "w-56 hover:shadow-md hover:border-slate-300"
            }
          `}
        >
          <FaSearch
            className={`text-sm transition-all duration-300 ${
              searchFocused ? "text-blue-600 scale-105" : "text-slate-400"
            }`}
          />
          <input
            type="text"
            placeholder="Search command or page..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bg-transparent outline-none text-sm text-slate-800 placeholder-slate-400 w-full font-medium"
          />
          {searchFocused && (
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 animate-fadeIn flex-shrink-0">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 shadow-sm border border-slate-300/60">
                ⌘
              </kbd>
              <span>K</span>
            </div>
          )}
        </div>

        {/* Notifications (Refined Badge) */}
        <button
          className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-all duration-300 text-slate-600 hover:text-blue-600 group"
          title="Notifications"
        >
          <FaBell className="text-lg group-hover:animate-wiggle" />
          {notifications > 0 && (
            <>
              <span className="absolute top-0 right-0 min-w-[16px] h-4 px-1 bg-red-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md shadow-red-500/40 border-2 border-white transform origin-top-right scale-90">
                {notifications}
              </span>
            </>
          )}
        </button>

        {/* Settings */}
        <button
          className="p-2.5 rounded-xl hover:bg-slate-100 transition-all duration-300 text-slate-600 hover:text-blue-600 group"
          title="Settings"
        >
          <FaCog className="text-lg group-hover:rotate-[180deg] transition-transform duration-700 ease-in-out" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-300/80 mx-1" />

        {/* Profile (Enhanced) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl transition-all duration-300 border border-transparent
             ${
               open
                 ? "bg-slate-100/80 border-slate-300/50"
                 : "hover:bg-slate-100/50 group"
             }`}
          >
            <div className="relative flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-blue-500/40">
                {userName?.charAt(0)?.toUpperCase() || (
                  <FaUserCircle className="w-5 h-5" />
                )}
              </div>
              <span className="absolute -bottom-0 -right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-lg" />
            </div>

            <div className="hidden sm:flex flex-col items-start min-w-[70px]">
              <span className="text-sm font-semibold text-slate-800 truncate max-w-[100px]">
                {userName.split(" ")[0]}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">
                {userRole}
              </span>
            </div>

            <FaChevronDown
              className={`text-[10px] text-slate-500 transition-all duration-300 ${
                open ? "rotate-180 text-blue-600" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl bg-white border border-slate-200/60 overflow-hidden animate-slideDown origin-top-right z-[100]">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wide">
                  {userRole}
                </p>
                <p className="font-bold text-slate-900 text-sm truncate">
                  {userName}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {userEmail}
                </p>
              </div>

              <div className="p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 font-semibold hover:bg-red-50 transition-all duration-200"
                >
                  <FaSignOutAlt className="text-sm flex-shrink-0" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Animations (Still required for shimmer/slide-down) */}
      <style>{`
        @keyframes subtleShimmer {
          0% { transform: translateX(-100%); opacity: 0.3; }
          50% { transform: translateX(100%); opacity: 0.1; }
          100% { transform: translateX(-100%); opacity: 0.3; }
        }
        .animate-subtleShimmer {
          animation: subtleShimmer 10s ease-in-out infinite;
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        .group:hover .group-hover\\:animate-wiggle {
          animation: wiggle 0.5s ease-in-out;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
      `}</style>
    </nav>
  );
}
