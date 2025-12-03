import React from "react";
// Import icons for visual clarity and differentiation
import {
  Users,
  BookOpen,
  GraduationCap,
  UserCheck,
  Loader,
} from "lucide-react";

/* ===========================================================
    USER STATS — Displays key user counts by role.
 * @param {Array<Object>} users - Array of user objects (must contain a 'role' property).
 * @param {boolean} [loading=false] - Flag to indicate data is being fetched.
=========================================================== */
const UserStats = ({ users, loading = false }) => {
  // Ensure users is an array for safe reduction
  const userList = Array.isArray(users) ? users : [];

  // 1. Normalize backend roles and count
  const counts = userList.reduce(
    (acc, u) => {
      const role = (u.role || "").toLowerCase();
      // Ensure "admin" role covers general staff
      if (role === "student") acc.students += 1;
      else if (role === "teacher") acc.teachers += 1;
      else if (role === "parent") acc.parents += 1;
      else if (role === "admin") acc.admins += 1;
      // Add to total count
      acc.total += 1;
      return acc;
    },
    { students: 0, teachers: 0, parents: 0, admins: 0, total: 0 }
  );

  // 2. Define data items including icons and consolidated styles
  const items = [
    {
      title: "Total Users",
      value: counts.total,
      icon: Users,
      bg: "bg-gray-100",
      text: "text-gray-900",
      ring: "ring-gray-300",
    },
    {
      title: "Students",
      value: counts.students,
      icon: GraduationCap,
      bg: "bg-blue-100",
      text: "text-blue-700",
      ring: "ring-blue-300",
    },
    {
      title: "Teachers",
      value: counts.teachers,
      icon: BookOpen,
      bg: "bg-green-100",
      text: "text-green-700",
      ring: "ring-green-300",
    },
    {
      title: "Admin/Staff",
      value: counts.admins,
      icon: UserCheck,
      bg: "bg-purple-100",
      text: "text-purple-700",
      ring: "ring-purple-300",
    },
    // Parents stat is kept out of the main 4 for cleaner dashboard space, but can be added back if needed.
    // { title: "Parents", value: counts.parents, icon: User, bg: "bg-yellow-100", text: "text-yellow-700", ring: "ring-yellow-300" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-20 bg-gray-50 rounded-lg shadow mb-6">
        <Loader className="animate-spin text-blue-500 mr-3" size={24} />
        <span className="text-gray-600 font-medium">
          Loading user statistics...
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
      {items.map(({ title, value, icon: Icon, bg, text, ring }) => (
        <div
          key={title}
          className={`${bg} p-5 rounded-xl shadow-md flex items-center justify-between transform transition-all duration-300 hover:shadow-lg hover:ring-2 ${ring}`}
        >
          <div className="flex flex-col">
            {/* Title */}
            <span
              className={`text-sm font-semibold text-gray-600 uppercase mb-1`}
            >
              {title}
            </span>
            {/* Value */}
            <span className={`text-4xl font-extrabold ${text}`}>{value}</span>
          </div>

          {/* Icon */}
          <div
            className={`p-3 rounded-full ${bg} border border-opacity-30 ${text}`}
          >
            <Icon size={28} strokeWidth={2.5} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserStats;
