import {
  FaTachometerAlt,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaSchool,
  FaClipboardCheck,
  FaBookOpen,
  FaMoneyBillWave,
  FaUsersCog,
  FaCogs,
  FaHome,
} from "react-icons/fa";

// -------------------- ROUTES --------------------
export const ROUTES = {
  AUTH: {
    LOGIN: "/auth/login",
    FORGOT_PASSWORD: "/auth/forgot-password",
    VERIFY_OTP: "/auth/verify-otp",
    RESET_PASSWORD: "/auth/reset-password",
    SIGNUP: "/auth/signup",
  },
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    STUDENTS: "/admin/students",
    TEACHERS: "/admin/teachers",
    CLASSES: "/admin/classes",
    ATTENDANCE: "/admin/attendance",
    EXAMS: "/admin/exams",
    FEES: "/admin/fees",
    LEAVE: "/admin/leave",
    USER_MANAGEMENT: "/admin/user-management",
  },
  STUDENT: {
    DASHBOARD: "/student/dashboard",
  },
  TEACHER: {
    DASHBOARD: "/teacher/dashboard",
  },
};

// -------------------- ROLES --------------------
export const ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
};

// -------------------- STATUS --------------------
export const STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// -------------------- ATTENDANCE STATUS --------------------
export const ATTENDANCE_STATUS = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LEAVE: "Leave",
};

// -------------------- PAGINATION --------------------
export const PAGINATION = {
  ITEMS_PER_PAGE: 10,
  DEFAULT_PAGE: 1,
};

// -------------------- API --------------------
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const API_ENDPOINTS = {
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  USERS: "/admin/users",
  STUDENTS: "/admin/students",
  TEACHERS: "/admin/teachers",
  CLASSES: "/admin/classes",
  ATTENDANCE: "/admin/attendance",
  EXAMS: "/admin/exams",
  FEES: "/admin/fees",
  LEAVE: "/admin/leave",
};

// -------------------- ADMIN SIDEBAR --------------------
export const ADMIN_SIDEBAR_SECTIONS = [
  {
    name: "Dashboard",
    icon: FaHome,
    links: [
      {
        name: "Dashboard",
        path: ROUTES.ADMIN.DASHBOARD,
        icon: FaTachometerAlt,
      },
    ],
  },
  {
    name: "Academics",
    icon: FaBookOpen,
    links: [
      { name: "Students", path: ROUTES.ADMIN.STUDENTS, icon: FaUserGraduate },
      {
        name: "Teachers",
        path: ROUTES.ADMIN.TEACHERS,
        icon: FaChalkboardTeacher,
      },
      { name: "Classes", path: ROUTES.ADMIN.CLASSES, icon: FaSchool },
      {
        name: "Attendance",
        path: ROUTES.ADMIN.ATTENDANCE,
        icon: FaClipboardCheck,
      },
      { name: "Exams", path: ROUTES.ADMIN.EXAMS, icon: FaBookOpen },
    ],
  },
  {
    name: "Administration",
    icon: FaUsersCog,
    links: [
      { name: "Fees", path: ROUTES.ADMIN.FEES, icon: FaMoneyBillWave },
      {
        name: "User Management",
        path: ROUTES.ADMIN.USER_MANAGEMENT,
        icon: FaUsersCog,
      },
    ],
  },
  {
    name: "Support / Extras",
    icon: FaCogs,
    links: [
      // Add future links here
    ],
  },
];
