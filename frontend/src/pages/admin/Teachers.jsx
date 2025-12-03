// frontend/src/pages/admin/Teachers.jsx

import React, { useState, useEffect } from "react";
// ... other imports (DataTable, adminService, etc.)
// 💡 IMPORTANT: Replace the old StudentFormModal/TeacherFormModal with the generic AddUserModal
import AddUserModal from "../../components/user-management/AddUserModal";
// ^^^ Ensure this path is correct relative to Teachers.jsx

const Teachers = () => {
  // 1. STATE MANAGEMENT
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false); // State to control the modal

  // ... useEffect to load teachers data ...

  // 2. NEW SAVE FUNCTION (Called by the Modal on submission)
  const handleSaveTeacher = async (formData) => {
    try {
      // Note: formData already includes the specific fields and role: "teacher"
      console.log("Attempting to save new teacher:", formData);
      // Replace with your actual API call
      // await adminService.createTeacher(formData);

      alert(`Successfully added new Teacher: ${formData.name}`);
      setShowAddModal(false);
      // Re-fetch data to update the table
      // loadTeachers();
    } catch (error) {
      console.error("Failed to add teacher:", error);
      alert("Error adding teacher. Check console for details.");
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Teacher Management</h1>

        {/* 3. BUTTON CLICK HANDLER */}
        <button
          onClick={() => setShowAddModal(true)} // Opens the generic modal
          className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
        >
          + Add New Teacher
        </button>
      </div>

      {/* ... Your Teacher Table/DataTable Component Renders Here ... */}

      {/* 4. RENDER THE GENERIC MODAL WITH THE CORRECT USER TYPE */}
      {showAddModal && (
        <AddUserModal
          userType="teacher" // <--- 🏆 THE FIX: This tells the modal which form to load
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveTeacher} // <--- Links to the Teacher API handler
        />
      )}
    </div>
  );
};

export default Teachers;
