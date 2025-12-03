import React from "react";
import { Outlet } from "react-router-dom";

const TeacherLayout = () => {
  return (
    <div>
      <header style={{ padding: "10px", background: "#e0f7fa" }}>
        <h1>Teacher Dashboard</h1>
      </header>
      <main style={{ padding: "20px" }}>
        <Outlet /> {/* Nested routes for teacher pages will render here */}
      </main>
    </div>
  );
};

export default TeacherLayout;
