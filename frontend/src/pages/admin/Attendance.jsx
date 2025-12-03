import React, { useState } from "react";
import {
  FaSearch,
  FaDownload,
  FaSync,
  FaEdit,
  FaCalendarAlt,
} from "react-icons/fa";
import { MdCheckCircle, MdCancel, MdAccessTime, MdSick } from "react-icons/md";

const Attendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [students, setStudents] = useState([
    {
      id: "S001",
      name: "John Doe",
      class: "Class 1A",
      status: "Present",
      timeIn: "08:30",
      timeOut: "15:00",
      remarks: "",
    },
    {
      id: "S002",
      name: "Jane Smith",
      class: "Class 1A",
      status: "Absent",
      timeIn: "-",
      timeOut: "-",
      remarks: "Sick leave",
    },
    {
      id: "S003",
      name: "Alice Brown",
      class: "Class 2B",
      status: "Late",
      timeIn: "09:05",
      timeOut: "15:00",
      remarks: "",
    },
    {
      id: "S004",
      name: "Bob Johnson",
      class: "Class 2B",
      status: "Present",
      timeIn: "08:25",
      timeOut: "15:00",
      remarks: "",
    },
  ]);
  const [editStudent, setEditStudent] = useState(null);

  const filtered = students.filter(
    (s) =>
      (filterClass === "All" || s.class === filterClass) &&
      (filterStatus === "All" || s.status === filterStatus) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase()))
  );

  const getSummary = () => {
    const total = students.length;
    const present = students.filter((s) => s.status === "Present").length;
    const absent = students.filter((s) => s.status === "Absent").length;
    const late = students.filter((s) => s.status === "Late").length;
    const leave = students.filter((s) => s.status === "Leave").length;
    return { total, present, absent, late, leave };
  };

  const summary = getSummary();

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Attendance Management
        </h1>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow">
            <FaDownload /> Export CSV
          </button>
          <button className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg shadow">
            <FaSync /> Refresh
          </button>
        </div>
      </div>

      {/* DATE & FILTERS */}
      <div className="bg-white shadow-md rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-gray-500" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
          >
            <option>All</option>
            <option>Class 1A</option>
            <option>Class 2B</option>
            <option>Class 3C</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
          >
            <option>All</option>
            <option>Present</option>
            <option>Absent</option>
            <option>Late</option>
            <option>Leave</option>
          </select>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={<MdCheckCircle size={28} />}
          label="Present"
          count={summary.present}
          color="green"
        />
        <SummaryCard
          icon={<MdCancel size={28} />}
          label="Absent"
          count={summary.absent}
          color="red"
        />
        <SummaryCard
          icon={<MdAccessTime size={28} />}
          label="Late"
          count={summary.late}
          color="yellow"
        />
        <SummaryCard
          icon={<MdSick size={28} />}
          label="Leave"
          count={summary.leave}
          color="purple"
        />
      </div>

      {/* ATTENDANCE TABLE */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="w-full border-collapse">
          <thead className="bg-gray-200 text-gray-700 uppercase text-sm">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Class</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Time In</th>
              <th className="px-4 py-3 text-left">Time Out</th>
              <th className="px-4 py-3 text-left">Remarks</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{s.id}</td>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{s.class}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-white text-sm ${
                      s.status === "Present"
                        ? "bg-green-600"
                        : s.status === "Absent"
                        ? "bg-red-600"
                        : s.status === "Late"
                        ? "bg-yellow-500"
                        : "bg-purple-500"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3">{s.timeIn}</td>
                <td className="px-4 py-3">{s.timeOut}</td>
                <td className="px-4 py-3 text-gray-600">{s.remarks || "-"}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setEditStudent(s)}
                    className="text-yellow-600 hover:text-yellow-800"
                  >
                    <FaEdit />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-500">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {editStudent && (
        <EditAttendanceModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSave={(updated) => {
            setStudents((prev) =>
              prev.map((s) => (s.id === updated.id ? updated : s))
            );
            setEditStudent(null);
          }}
        />
      )}
    </div>
  );
};

export default Attendance;

/* === Summary Card Component === */
const SummaryCard = ({ icon, label, count, color }) => {
  const colors = {
    green: "bg-green-100 text-green-700 border-green-500",
    red: "bg-red-100 text-red-700 border-red-500",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-500",
    purple: "bg-purple-100 text-purple-700 border-purple-500",
  };
  return (
    <div
      className={`p-4 rounded-xl border ${colors[color]} flex items-center justify-between shadow-sm`}
    >
      <div className="flex items-center gap-3">
        <div>{icon}</div>
        <div>
          <p className="font-semibold">{label}</p>
          <h2 className="text-xl font-bold">{count}</h2>
        </div>
      </div>
    </div>
  );
};

/* === Edit Modal Component === */
const EditAttendanceModal = ({ student, onClose, onSave }) => {
  const [status, setStatus] = useState(student.status);
  const [remarks, setRemarks] = useState(student.remarks);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...student, status, remarks });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-lg w-11/12 md:w-1/3 space-y-4"
      >
        <h2 className="text-xl font-bold">Edit Attendance - {student.name}</h2>
        <div className="flex flex-col gap-2">
          <label className="font-semibold">Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
          >
            <option>Present</option>
            <option>Absent</option>
            <option>Late</option>
            <option>Leave</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold">Remarks:</label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional note"
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};
