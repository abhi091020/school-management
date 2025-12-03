import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FaBars, FaTimes, FaTrashRestore } from "react-icons/fa";

const Sidebar = ({ isOpen, setIsOpen, sections }) => {
  const [expanded, setExpanded] = useState({});
  const location = useLocation();

  // Recycle Bin added at bottom of sidebar (full animation support)
  const enhancedSections = [
    ...sections,
    {
      name: "Recycle Bin",
      icon: FaTrashRestore,
      links: [
        {
          name: "Recycle Bin",
          icon: FaTrashRestore,
          path: "/admin/recycle-bin",
        },
      ],
    },
  ];

  const toggle = (name) =>
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));

  const isPathActive = (path) => {
    if (!path) return false;
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <>
      <aside
        className={`
          fixed top-0 left-0 h-screen overflow-y-auto custom-scrollbar
          bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800
          border-r border-slate-700/30 shadow-2xl shadow-slate-950/50
          transition-all duration-500 ease-out z-50
          ${isOpen ? "w-64" : "w-16"}
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-cyan-600/5 pointer-events-none" />

        {/* HEADER */}
        <div className="relative h-16 flex items-center px-3 border-b border-slate-700/30 bg-slate-900/90 backdrop-blur-xl">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="absolute left-3 p-2 rounded-xl hover:bg-slate-700/50 transition-all duration-300 text-slate-400 hover:text-white group z-10"
          >
            <div className="relative w-5 h-5">
              <FaBars
                className={`absolute inset-0 text-base transition-all duration-500 ${
                  isOpen ? "opacity-0 rotate-180 scale-50" : "opacity-100"
                }`}
              />
              <FaTimes
                className={`absolute inset-0 text-base transition-all duration-500 ${
                  isOpen ? "opacity-100" : "opacity-0 -rotate-180 scale-50"
                }`}
              />
            </div>
          </button>

          <div
            className={`
              flex items-center gap-2.5 transition-all duration-500 ml-11
              ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
            `}
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 overflow-hidden group">
              <span className="relative z-10 text-white font-bold text-base">
                L
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="text-lg font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                LearnIQ
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                <div className="text-[9px] uppercase tracking-wider text-slate-500">
                  Admin Panel
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-x-hidden py-4 px-2">
          {/* COLLAPSED MODE */}
          {!isOpen ? (
            <div className="flex flex-col gap-2">
              {enhancedSections.flatMap(({ links }) =>
                links.map(({ name: linkName, icon: Icon, path }) => {
                  const active = isPathActive(path);

                  return (
                    <NavLink
                      key={linkName}
                      to={path}
                      end
                      className={`
                        group relative flex items-center justify-center rounded-xl h-11 w-full transition-all duration-300
                        ${
                          active
                            ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                        }
                      `}
                    >
                      <div
                        className={`
                          relative flex items-center justify-center rounded-lg overflow-hidden transition-all duration-300 w-9 h-9
                          ${
                            active
                              ? "bg-white/20 shadow-inner"
                              : "bg-slate-800/50 group-hover:bg-slate-700/50 group-hover:scale-105"
                          }
                        `}
                      >
                        <Icon
                          className={`
                            relative z-10 text-base transition-all duration-300
                            ${
                              active
                                ? "text-white"
                                : "text-slate-400 group-hover:text-cyan-400"
                            }
                          `}
                        />
                      </div>

                      {active && (
                        <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50" />
                      )}
                    </NavLink>
                  );
                })
              )}
            </div>
          ) : (
            /* EXPANDED MODE */
            enhancedSections.map(({ name, icon: SectionIcon, links }) => {
              const expandedState = expanded[name];

              return (
                <div key={name} className="mb-4">
                  {/* Section Toggle */}
                  <button
                    onClick={() => toggle(name)}
                    className="w-full flex items-center justify-between px-2.5 py-2 mb-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-300 overflow-hidden">
                        <SectionIcon className="relative z-10 text-blue-400 text-[10px]" />
                      </div>
                      <span className="text-[10px]">{name}</span>
                    </div>

                    <svg
                      className={`w-3 h-3 transition-transform duration-300 ${
                        expandedState ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Sub-links */}
                  <div
                    className={`flex flex-col gap-2 ${
                      expandedState ? "" : "hidden"
                    }`}
                  >
                    {links.map(({ name: linkName, icon: Icon, path }) => {
                      const active = isPathActive(path);

                      return (
                        <NavLink
                          key={linkName}
                          to={path}
                          end
                          className={`
                            group relative flex items-center rounded-xl text-sm font-medium h-11 transition-all duration-300
                            ${
                              active
                                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                            }
                            px-3 gap-3
                          `}
                        >
                          {active && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-lg shadow-white/50" />
                          )}

                          {/* Icon */}
                          <div
                            className={`
                              relative flex items-center justify-center rounded-lg overflow-hidden transition-all duration-300 w-9 h-9
                              ${
                                active
                                  ? "bg-white/20 shadow-inner"
                                  : "bg-slate-800/50 group-hover:bg-slate-700/50 group-hover:scale-105"
                              }
                            `}
                          >
                            <Icon
                              className={`
                                relative z-10 text-base transition-all duration-300
                                ${
                                  active
                                    ? "text-white"
                                    : "text-slate-400 group-hover:text-cyan-400"
                                }
                              `}
                            />
                          </div>

                          <span className="flex-1 text-[13px]">{linkName}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </nav>

        {/* FOOTER */}
        <div
          className={`
            p-3 border-t border-slate-700/30 bg-slate-900/90 backdrop-blur-xl
            transition-all duration-500
            ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
          `}
        >
          <div className="relative flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/50 hover:from-slate-800 hover:to-slate-700/80 transition-all duration-300 cursor-pointer overflow-hidden border border-slate-700/30">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

            <div className="relative z-10 w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div className="relative z-10 flex-1 min-w-0">
              <p className="text-[11px] font-bold text-white">System Online</p>
              <p className="text-[9px] text-slate-400">
                All systems operational
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* HIDE SCROLLBARS */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
