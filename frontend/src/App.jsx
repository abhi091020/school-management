import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { ROUTES, ROLES } from "./constants/constants";

// Layouts
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const StudentLayout = lazy(() => import("./layouts/StudentLayout"));
const TeacherLayout = lazy(() => import("./layouts/TeacherLayout"));

// Admin Pages
const DashboardHome = lazy(() => import("./pages/admin/DashboardHome"));
const Students = lazy(() => import("./pages/admin/Students"));
const Teachers = lazy(() => import("./pages/admin/Teachers"));
const Classes = lazy(() => import("./pages/admin/Classes"));
const Attendance = lazy(() => import("./pages/admin/Attendance"));
const Exams = lazy(() => import("./pages/admin/Exams"));
const Fees = lazy(() => import("./pages/admin/Fees"));
const LeaveApplication = lazy(() => import("./pages/admin/LeaveApplication"));
const UserManagementPage = lazy(() =>
  import("./pages/admin/UserManagementPage")
);

// *** ADD THIS ***
const RecycleBinPage = lazy(() => import("./pages/admin/recycle-bin"));

// Student / Teacher Pages
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));

// Auth
const Login = lazy(() => import("./pages/auth/Login"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const VerifyOTP = lazy(() => import("./pages/auth/VerifyOTP"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const Signup = lazy(() => import("./pages/auth/Signup"));

// 404
const NotFound = lazy(() => import("./pages/auth/NotFound"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="text-center mt-20">Loading...</div>}>
        <Routes>
          {/* AUTH ROUTES */}
          <Route path={ROUTES.AUTH.LOGIN} element={<Login />} />
          <Route
            path={ROUTES.AUTH.FORGOT_PASSWORD}
            element={<ForgotPassword />}
          />
          <Route path={ROUTES.AUTH.VERIFY_OTP} element={<VerifyOTP />} />
          <Route
            path={ROUTES.AUTH.RESET_PASSWORD}
            element={<ResetPassword />}
          />
          <Route path={ROUTES.AUTH.SIGNUP} element={<Signup />} />

          {/* ADMIN ROUTES */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="students" element={<Students />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="classes" element={<Classes />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="exams" element={<Exams />} />
            <Route path="fees" element={<Fees />} />
            <Route path="leave" element={<LeaveApplication />} />
            <Route path="user-management" element={<UserManagementPage />} />

            {/* ✅ NEW ROUTE ADDED */}
            <Route path="recycle-bin" element={<RecycleBinPage />} />

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* STUDENT ROUTES */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute roles={[ROLES.STUDENT]}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* TEACHER ROUTES */}
          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute roles={[ROLES.TEACHER]}>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* DEFAULT REDIRECT */}
          <Route
            path="/"
            element={<Navigate to={ROUTES.AUTH.LOGIN} replace />}
          />

          {/* FALLBACK */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
