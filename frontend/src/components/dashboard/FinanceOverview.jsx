import React from "react";
import { FaWallet, FaArrowUp } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import SectionHeader from "../common/SectionHeader"; // Assuming this is an existing component
import ProgressBar from "../common/ProgressBar"; // Assuming this is an existing component

// 🚨 CHART.JS REGISTRATION (CRITICAL for chart rendering) 🚨
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
// 🚨 END CRITICAL FIX 🚨

const FinanceOverview = ({
  financeOverview = { collected: 0, pending: 0, target: 0, expenses: 0 },
  financialData = { labels: [], datasets: [] },
  lineChartOptions,
  navigate,
}) => {
  const { collected, pending, target, expenses } = financeOverview;

  // Helper function to safely format currency
  const formatLakhs = (value) => `₹${(value / 100000 || 0).toFixed(1)}L`;
  const formatThousands = (value) => `₹${(value / 1000 || 0).toFixed(0)}K`;

  return (
    // Replaced lg:col-span-2 with a full-width section class. Span is managed in DashboardHome.
    <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100 p-5 h-full">
      <SectionHeader
        icon={FaWallet}
        title="Revenue & Expense Snapshot"
        iconBg="bg-emerald-100 text-emerald-700"
        action
        actionLabel="View Report"
        onAction={() => navigate("/admin/fees")}
      />

      {/* Metric Boxes - Reduced gap, padding, and font sizes for compactness */}
      <div className="grid grid-cols-2 gap-3 mt-3 mb-3">
        {/* Total Collected */}
        <div className="p-3 rounded-xl bg-white border border-emerald-300 shadow-sm transition hover:shadow-md">
          <p className="text-xs text-emerald-600 font-semibold mb-1 uppercase tracking-wider">
            Collected YTD
          </p>
          <p className="text-2xl font-extrabold text-emerald-800">
            {formatLakhs(collected)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 font-medium">
            <FaArrowUp className="text-[8px]" /> 12% from last month
          </div>
        </div>

        {/* Pending Fees */}
        <div className="p-3 rounded-xl bg-white border border-red-300 shadow-sm transition hover:shadow-md">
          <p className="text-xs text-red-600 font-semibold mb-1 uppercase tracking-wider">
            Pending Fees
          </p>
          <p className="text-2xl font-extrabold text-red-700">
            {formatThousands(pending)}
          </p>
          <p className="text-[10px] text-red-500 mt-1 font-medium">
            Overdue amount
          </p>
        </div>
      </div>

      {/* Progress Bars Section - Tightened vertical spacing (space-y-2) and pt-3 */}
      <div className="space-y-2 border-t border-slate-100 pt-3">
        <h4 className="text-sm font-bold text-slate-700">Financial Goals</h4>
        <ProgressBar
          value={collected}
          max={target}
          color="bg-gradient-to-r from-emerald-600 to-teal-500"
          label="Annual Collection Target"
        />
        <ProgressBar
          value={expenses}
          max={collected}
          color="bg-gradient-to-r from-amber-600 to-orange-500"
          label="Total Expenses"
        />
      </div>

      {/* Chart Section - CRITICAL HEIGHT REDUCTION: h-44 is the main control */}
      <div className="mt-3 border-t border-slate-100 pt-3 relative">
        <h4 className="text-sm font-bold text-slate-700 mb-2">
          Monthly Trends
        </h4>
        <div className="h-44">
          {" "}
          {/* Controls the Calendar height via flex alignment */}
          <Line data={financialData} options={lineChartOptions} />
        </div>
      </div>
    </section>
  );
};

export default React.memo(FinanceOverview);
