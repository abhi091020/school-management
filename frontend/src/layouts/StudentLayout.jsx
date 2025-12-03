import React from "react";
import { Outlet } from "react-router-dom";

const StudentLayout = () => {
  return (
    <div>
      <header style={{ padding: "10px", background: "#f5f5f5" }}>
        <h1>Student Dashboard</h1>
      </header>
      <main style={{ padding: "20px" }}>
        <Outlet /> {/* This renders nested routes */}
      </main>
    </div>
  );
};

export default StudentLayout;
