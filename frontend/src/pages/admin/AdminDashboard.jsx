// src/pages/admin/AdminDashboard.jsx
import React from "react";
import Sidebar from "../../components/admin/Sidebar";
import { Outlet } from "react-router-dom";

const AdminDashboard = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-100 p-6 overflow-auto">
        <Outlet /> {/* This renders the selected tab page */}
      </main>
    </div>
  );
};

export default AdminDashboard;
