import React, { useState, useEffect, useCallback } from "react";
import {
  FaSearch,
  FaPlus,
  FaEye,
  FaTrash,
  FaEdit,
  FaTimes,
} from "react-icons/fa";

import {
  getStudents,
  createStudent,
  deleteStudent,
  getClasses,
  updateStudent,
} from "../../api/studentService";

import AddUserModal from "../../components/user-management/AddUserModal";

const DetailItem = ({ label, value, className = "" }) => (
  <div className="flex justify-between border-b last:border-b-0 py-1">
    <span className="font-medium text-gray-600">{label}:</span>
    <span className={`text-right ${className}`}>{value}</span>
  </div>
);

const StudentDetailsModal = ({ student, onClose }) => {
  const getClassDisplay = () => {
    if (!student.classId) return "N/A";
    return student.classId.name
      ? `${student.classId.name} ${student.classId.section}`
      : "N/A";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-11/12 md:w-1/3 shadow-2xl relative">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-bold text-gray-800">Student Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="space-y-1 text-gray-700">
          <DetailItem label="User ID" value={student.userId || "N/A"} />
          <DetailItem label="Full Name" value={student.name || "N/A"} />
          <DetailItem label="Email" value={student.email || "N/A"} />
          <DetailItem label="Phone" value={student.phone || "N/A"} />
          <DetailItem label="Class" value={getClassDisplay()} />
          <DetailItem
            label="Father's Name"
            value={student.fatherName || "N/A"}
          />
          <DetailItem
            label="Mother's Name"
            value={student.motherName || "N/A"}
          />
          <DetailItem
            label="Status"
            value={student.status}
            className={
              student.status === "active"
                ? "text-green-600 font-semibold"
                : "text-red-600 font-semibold"
            }
          />
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const Students = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [viewStudent, setViewStudent] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getStudents();
      setStudents(data || []);
    } catch (err) {
      console.error("Error loading students:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadClasses = async () => {
    try {
      const data = await getClasses();
      setClasses(data || []);
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    }
  };

  useEffect(() => {
    loadStudents();
    loadClasses();
  }, [loadStudents]);

  const handleSaveStudent = async (payload) => {
    try {
      const finalPayload = {
        user: {
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          gender: payload.gender,
          role: "STUDENT",
        },
        student: {
          classId: payload.classId,
          dob: payload.dob,
          bloodGroup: payload.bloodGroup,
          rollNumber: payload.rollNumber,
          division: payload.division,
          academicYear: payload.academicYear,
          previousSchool: payload.previousSchool,
          category: payload.category,
          medicalNotes: payload.medicalNotes,
        },
        parent: {
          fatherName: payload.fatherName,
          fatherPhone: payload.fatherPhone,
          motherName: payload.motherName,
          motherPhone: payload.motherPhone,
          occupation: payload.occupation,
          annualIncome: payload.annualIncome,
          address: payload.address,
          city: payload.city,
          state: payload.state,
          pincode: payload.pincode,
          emergencyContactPhone: payload.emergencyContactPhone,
          isPrimaryGuardian: true,
        },
      };

      let savedStudent;

      if (editingStudent) {
        savedStudent = await updateStudent(editingStudent.userId, finalPayload);

        setStudents((prev) =>
          prev.map((s) =>
            s.userId === editingStudent.userId ? savedStudent : s
          )
        );
      } else {
        savedStudent = await createStudent(finalPayload);
        setStudents((prev) => [savedStudent, ...prev]);
      }

      setShowFormModal(false);
      setEditingStudent(null);
      alert(`Student ${editingStudent ? "updated" : "created"} successfully!`);
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          `Failed to ${editingStudent ? "update" : "create"} student`
      );
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this student?"
      )
    )
      return;

    try {
      await deleteStudent(id);
      setStudents((prev) => prev.filter((s) => s.userId !== id));
      alert("Student deleted successfully!");
    } catch (err) {
      alert("Delete failed");
      console.error(err);
    }
  };

  const openAddForm = () => {
    setEditingStudent(null);
    setShowFormModal(true);
  };

  const openEditForm = (student) => {
    setEditingStudent(student);
    setShowFormModal(true);
  };

  const handleCancelForm = () => {
    setShowFormModal(false);
    setEditingStudent(null);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.userId?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Students</h1>

        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition"
          onClick={openAddForm}
        >
          <FaPlus />
          Add Student
        </button>
      </div>

      <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow">
        <FaSearch className="text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, ID, or email..."
          className="w-full p-2 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-lg shadow-lg bg-white">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-200 text-gray-700 text-sm uppercase">
            <tr>
              <th className="px-6 py-3 text-left">User ID</th>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Class</th>
              <th className="px-6 py-3 text-left">Phone</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center p-6">
                  Loading...
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-6 text-gray-500">
                  No students found.
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr
                  key={s.userId}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-3">{s.userId}</td>
                  <td className="px-6 py-3">{s.name}</td>
                  <td className="px-6 py-3">
                    {s.classId?.name} {s.classId?.section}
                  </td>
                  <td className="px-6 py-3">{s.phone || "-"}</td>
                  <td
                    className={`px-6 py-3 font-semibold ${
                      s.status === "active" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {s.status}
                  </td>

                  <td className="px-6 py-3 flex justify-center gap-2">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => setViewStudent(s)}
                    >
                      <FaEye />
                    </button>

                    <button
                      className="text-yellow-600 hover:text-yellow-800"
                      onClick={() => openEditForm(s)}
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleDelete(s.userId)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewStudent && (
        <StudentDetailsModal
          student={viewStudent}
          onClose={() => setViewStudent(null)}
        />
      )}

      {showFormModal && (
        <AddUserModal
          userType="student"
          onClose={handleCancelForm}
          onSave={handleSaveStudent}
          initialData={editingStudent}
        />
      )}
    </div>
  );
};

export default Students;
