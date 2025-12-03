import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FaServer, FaDatabase, FaCloud, FaClock } from "react-icons/fa";

dayjs.extend(relativeTime);

const StatusBarFooter = ({ lastUpdated }) => {
  return (
    // ✨ MODERN UI: Applied standard card styling and padding
    <footer
      className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100 p-4"
      // Removed animation for a footer, which is usually static
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left Section: System Status Icons */}
        <div className="flex items-center gap-6 flex-wrap">
          {/* System Status */}
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <FaServer className="text-emerald-500 w-4 h-4" />
            <span>
              System: <strong className="text-emerald-700">Online</strong>
            </span>
          </div>

          {/* Database Status */}
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <FaDatabase className="text-blue-500 w-4 h-4" />
            <span>
              Database: <strong className="text-blue-700">Connected</strong>
            </span>
          </div>

          {/* Backup Status */}
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <FaCloud className="text-purple-500 w-4 h-4" />
            <span>
              Backup: <strong className="text-purple-700">Synced</strong>
            </span>
          </div>
        </div>

        {/* Right Section: Version and Sync Time */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-600">
            Version 2.5.0
          </span>
          <span className="text-xs text-slate-300">|</span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <FaClock className="text-slate-400 w-3 h-3" />
            Last sync:{" "}
            <strong className="text-slate-700">
              {dayjs(lastUpdated).fromNow()}
            </strong>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(StatusBarFooter);
