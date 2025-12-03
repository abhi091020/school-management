import React from "react";

// Base Skeleton animation class
const Skeleton = ({ className }) => (
  // Enhanced shimmer animation and default rounded style
  <div
    className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-shimmer rounded-xl ${className}`}
  />
);

// Skeleton for KPICard (Correctly exported as named export)
export const KPICardSkeleton = () => (
  // Matches the new rounded-3xl KPICard shape
  <div className="bg-white/90 rounded-3xl p-6 shadow-xl border border-slate-100">
    <div className="flex items-start justify-between">
      <div className="space-y-4 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="w-14 h-14 rounded-xl" />
    </div>
  </div>
);

// Skeleton for Table Row
export const TableRowSkeleton = () => (
  <tr className="border-b border-slate-100">
    <td className="py-4 px-5">
      <Skeleton className="h-4 w-32" />
    </td>
    <td className="py-4 px-5">
      <Skeleton className="h-4 w-24" />
    </td>
    <td className="py-4 px-5">
      <Skeleton className="h-8 w-20 rounded-full" />
    </td>
  </tr>
);

// Skeleton for Notification/Activity List Item
export const NotificationSkeleton = () => (
  // Matches the new rounded-xl list item style
  <div className="flex items-center space-x-4 p-3 rounded-xl border border-slate-100 bg-slate-50">
    {/* Icon Placeholder */}
    <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
    {/* Text Lines */}
    <div className="flex-1 space-y-2 py-1">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/3" />
    </div>
    {/* Arrow/Time Placeholder */}
    <Skeleton className="h-4 w-8" />
  </div>
);

// ⭐ NEW: Activity/Recent Activity List Item Skeleton
export const ActivitySkeleton = () => (
  // Harmonized style to match NotificationSkeleton
  <div className="flex items-center space-x-4 p-3 rounded-xl border border-slate-100 bg-slate-50">
    {/* Icon Placeholder */}
    <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
    {/* Text Lines */}
    <div className="flex-1 space-y-2 py-1">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/3" />
    </div>
    {/* Arrow/Time Placeholder */}
    <Skeleton className="h-4 w-8" />
  </div>
);

export default React.memo(Skeleton);
