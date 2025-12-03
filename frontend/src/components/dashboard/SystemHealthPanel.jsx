import React from "react";
import { FaServer } from "react-icons/fa";
import SectionHeader from "../common/SectionHeader";
import SystemStatus from "../common/SystemStatus";

// Configuration Array for Statuses: Defines the structure and default values
const STATUS_CONFIG = [
  { label: "Server Status", key: "server", defaultValue: "99.9% uptime" },
  { label: "Database", key: "database", defaultValue: "45ms response" },
  { label: "API Gateway", key: "api", defaultValue: "Healthy" },
  { label: "Last Backup", key: "backup", defaultValue: "2 hours ago" },
];

const SystemHealthPanel = ({
  // Example expected systemHealth structure: { server: 'UP', database: 'DEGRADED', api: 'DOWN', backup: 'SUCCESS' }
  systemHealth = {},
  storageUsedPercent = 68,
  storageUsedValue = "1.4TB",
}) => {
  return (
    <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100 p-6">
      <SectionHeader
        icon={FaServer}
        title="System Health"
        iconBg="bg-slate-100 text-slate-700"
      />

      {/* Dynamic Status List using map() */}
      <div className="space-y-3 pt-4 border-t border-slate-100 mt-4">
        {STATUS_CONFIG.map(({ label, key, defaultValue }) => (
          <SystemStatus
            key={key}
            label={label}
            // Passes the raw status string (e.g., 'UP', 'DOWN') for color mapping
            status={systemHealth[key]}
            // Passes the metric value for display
            value={defaultValue}
          />
        ))}
      </div>

      {/* Dynamic Storage Usage Bar */}
      <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-slate-800">Storage Used</span>
          <span className="text-sm font-semibold text-slate-600">
            **{storageUsedPercent}%** ({storageUsedValue})
          </span>
        </div>
        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full w-[${storageUsedPercent}%] bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full shadow-md`}
            style={{ width: `${storageUsedPercent}%` }}
          />
        </div>
      </div>
    </section>
  );
};

export default React.memo(SystemHealthPanel);
