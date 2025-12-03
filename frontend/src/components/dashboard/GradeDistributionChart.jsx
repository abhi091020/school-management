import React from "react";
import { Doughnut } from "react-chartjs-2";
import { FaChartPie } from "react-icons/fa";
// NOTE: Ensure ChartJS is registered globally for Doughnut charts (ArcElement, Tooltip, Legend are needed)

const GradeDistributionChart = ({ gradeDistribution, doughnutOptions }) => {
  const data = {
    labels: gradeDistribution.labels,
    datasets: gradeDistribution.datasets,
  };

  return (
    // ✨ MODERN UI: Applied standard card styling
    <div className="h-full flex flex-col bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Header Area */}
      <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Icon with light accent */}
          <div className="p-2 rounded-xl bg-indigo-50">
            <FaChartPie className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Grade Distribution
          </h2>
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          All Subjects
        </span>
      </div>

      {/* Chart Area */}
      <div className="flex-1 p-6 flex items-center justify-center min-h-[300px]">
        {/* Adjusted size constraints for a balanced look */}
        <div className="relative w-full max-w-xs h-full flex items-center justify-center">
          <Doughnut
            key="grade-distribution-chart"
            data={data}
            options={doughnutOptions}
          />
          {/* Central Text Overlay */}
          <div className="absolute text-center">
            <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
              1.2K
            </p>
            <p className="text-sm text-slate-500 font-medium">Total Grades</p>
          </div>
        </div>
      </div>

      {/* Legend/Footer Area */}
      <div className="p-5 border-t border-slate-100 bg-slate-50/50">
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-sm font-medium">
          {gradeDistribution.labels.map((label, index) => (
            <li key={index} className="flex items-center text-slate-700">
              <span
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0 shadow-sm"
                style={{
                  backgroundColor:
                    gradeDistribution.datasets[0].backgroundColor[index],
                }}
              ></span>
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default React.memo(GradeDistributionChart);
