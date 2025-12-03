import React from "react";
// Using FaArrowRight for the action icon
import { FaArrowRight } from "react-icons/fa";

/**
 * Modern KPICard Component with Glassmorphism
 * * @param {string} label - The descriptive text for the KPI.
 * @param {string|number} value - The main metric value (e.g., "1,842", 63, "₹7.9M").
 * @param {React.Component} icon - The icon component (e.g., FaUserGraduate).
 * @param {string} gradient - Tailwind gradient class for the icon background (e.g., "from-blue-500 to-blue-600").
 * @param {Function} onClick - The function to execute when the card is clicked.
 * @param {number} delay - Optional delay for entrance animation.
 */
const KPICard = ({
  label,
  value,
  icon: Icon,
  gradient,
  onClick,
  delay = 0,
}) => {
  const cardClasses = `
    p-6 rounded-3xl border border-slate-200/80
    bg-white/95 backdrop-blur-md shadow-lg shadow-slate-200/50
    transition-all duration-300 ease-in-out
    transform hover:scale-[1.03] hover:shadow-2xl hover:border-blue-400
    cursor-pointer group
  `;

  // Styling for the icon container
  const iconClasses = `
    p-3 rounded-xl text-white shadow-xl
    bg-gradient-to-br ${gradient}
    transition-transform duration-300 ease-in-out group-hover:rotate-6
  `;

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      // Assuming a CSS class or utility handles the animation based on delay
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          {/* Main Value: Larger, Bolder, and more impactful */}
          <p className="text-5xl font-extrabold text-slate-900 tracking-tighter leading-none">
            {value}
          </p>
          {/* Label: Clear and uppercase */}
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest pt-1">
            {label}
          </p>
        </div>

        {/* Icon */}
        <div className={iconClasses}>
          {Icon && <Icon className="w-7 h-7" />}
        </div>
      </div>

      {/* Action/Detail Link at the bottom */}
      <div className="mt-6 border-t pt-4 border-slate-100">
        <div className="flex items-center text-sm font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-200">
          View Details
          <FaArrowRight className="ml-2 w-3 h-3 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
};

export default React.memo(KPICard);
