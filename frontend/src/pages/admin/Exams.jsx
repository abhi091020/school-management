import React, { useState, useEffect, useRef } from "react";
import { FaPlus, FaEye, FaEdit, FaTrash, FaSearch } from "react-icons/fa";

const Exams = () => {
  const [exams, setExams] = useState([
    {
      id: "E001",
      name: "Math Midterm",
      class: "Class 1",
      subject: "Math",
      date: "2025-11-15",
      totalMarks: 100,
      status: "Scheduled",
    },
    {
      id: "E002",
      name: "Science Quiz",
      class: "Class 2",
      subject: "Science",
      date: "2025-11-17",
      totalMarks: 50,
      status: "Scheduled",
    },
    {
      id: "E003",
      name: "English Final",
      class: "Class 3",
      subject: "English",
      date: "2025-12-01",
      totalMarks: 100,
      status: "Completed",
    },
  ]);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All Classes");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [viewExam, setViewExam] = useState(null);
  const [editExam, setEditExam] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const firstInputRef = useRef(null);
  useEffect(() => {
    if (showAddModal && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [showAddModal]);

  // Show only Scheduled exams on dashboard by default
  const filteredExams = exams
    .filter((e) => e.status === "Scheduled")
    .filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.class.toLowerCase().includes(search.toLowerCase()) ||
        e.subject.toLowerCase().includes(search.toLowerCase())
    )
    .filter((e) =>
      classFilter === "All Classes" ? true : e.class === classFilter
    )
    .filter((e) =>
      statusFilter === "All Status" ? true : e.status === statusFilter
    )
    .filter((e) => {
      if (dateFrom && new Date(e.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(e.date) > new Date(dateTo)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Latest exams first

  const handleSaveExam = (exam) => {
    if (editExam) {
      setExams((prev) => prev.map((e) => (e.id === exam.id ? exam : e)));
      setEditExam(null);
    } else {
      setExams((prev) => [...prev, exam]);
    }
    setShowAddModal(false);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Exams</h1>
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition"
          onClick={() => setShowAddModal(true)}
          aria-label="Add Exam"
        >
          <FaPlus />
          Add Exam
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, class, or subject..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search Exams"
          />
        </div>
        <select
          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          aria-label="Filter by Class"
        >
          <option>All Classes</option>
          <option>Class 1</option>
          <option>Class 2</option>
          <option>Class 3</option>
        </select>
        <select
          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by Status"
        >
          <option>All Status</option>
          <option>Scheduled</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>

        {/* Date Filters */}
        <div className="flex items-center gap-2">
          <label htmlFor="filter-date-from" className="text-gray-700">
            From:
          </label>
          <input
            id="filter-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded-lg p-2"
            aria-label="Filter exams from date"
          />
          <label htmlFor="filter-date-to" className="text-gray-700">
            To:
          </label>
          <input
            id="filter-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded-lg p-2"
            aria-label="Filter exams to date"
          />
        </div>
      </div>

      {/* Exams Table */}
      <div className="overflow-x-auto rounded-lg shadow-lg bg-white">
        <table className="w-full table-fixed border-collapse">
          <thead className="bg-gray-200 text-gray-700 uppercase text-sm">
            <tr>
              <th style={{ width: "8%" }} className="px-6 py-3 text-left">
                ID
              </th>
              <th style={{ width: "22%" }} className="px-6 py-3 text-left">
                Name
              </th>
              <th style={{ width: "12%" }} className="px-6 py-3 text-left">
                Class
              </th>
              <th style={{ width: "18%" }} className="px-6 py-3 text-left">
                Subject
              </th>
              <th style={{ width: "12%" }} className="px-6 py-3 text-left">
                Date
              </th>
              <th style={{ width: "12%" }} className="px-6 py-3 text-left">
                Total Marks
              </th>
              <th style={{ width: "10%" }} className="px-6 py-3 text-left">
                Status
              </th>
              <th style={{ width: "14%" }} className="px-6 py-3 text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredExams.length > 0 ? (
              filteredExams.map((e) => (
                <tr key={e.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-6 py-3">{e.id}</td>
                  <td className="px-6 py-3">{e.name}</td>
                  <td className="px-6 py-3">{e.class}</td>
                  <td className="px-6 py-3">{e.subject}</td>
                  <td className="px-6 py-3">{e.date}</td>
                  <td className="px-6 py-3">{e.totalMarks}</td>
                  <td
                    className={`px-6 py-3 font-semibold ${
                      e.status === "Scheduled"
                        ? "text-blue-600"
                        : e.status === "Completed"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {e.status}
                  </td>
                  <td className="px-6 py-3 flex justify-center gap-2">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => setViewExam(e)}
                      aria-label={`View details of ${e.name}`}
                      title="View"
                    >
                      <FaEye />
                    </button>
                    <button
                      className="text-yellow-600 hover:text-yellow-800"
                      onClick={() => {
                        setEditExam(e);
                        setShowAddModal(true);
                      }}
                      aria-label={`Edit ${e.name}`}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() =>
                        setExams((prev) => prev.filter((x) => x.id !== e.id))
                      }
                      aria-label={`Delete ${e.name}`}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center p-6 text-gray-500">
                  No exams found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Actions - placeholders */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <button
          disabled
          className="bg-green-600 cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg shadow transition opacity-50"
          title="Export CSV - coming soon"
        >
          Export CSV
        </button>
        <button
          disabled
          className="bg-indigo-600 cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg shadow transition opacity-50"
          title="Export Excel - coming soon"
        >
          Export Excel
        </button>
        <button
          disabled
          className="bg-red-600 cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg shadow transition opacity-50"
          title="Bulk Delete - coming soon"
        >
          Bulk Delete
        </button>
      </div>

      {/* View Exam Modal */}
      {viewExam && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-exam-title"
        >
          <div className="bg-white rounded-xl p-6 w-11/12 md:w-1/2 shadow-lg relative">
            <h2 id="view-exam-title" className="text-xl font-bold mb-4">
              {viewExam.name}
            </h2>
            <p>
              <strong>ID:</strong> {viewExam.id}
            </p>
            <p>
              <strong>Class:</strong> {viewExam.class}
            </p>
            <p>
              <strong>Subject:</strong> {viewExam.subject}
            </p>
            <p>
              <strong>Date:</strong> {viewExam.date}
            </p>
            <p>
              <strong>Total Marks:</strong> {viewExam.totalMarks}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={
                  viewExam.status === "Scheduled"
                    ? "text-blue-600"
                    : viewExam.status === "Completed"
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {viewExam.status}
              </span>
            </p>
            <button
              onClick={() => setViewExam(null)}
              aria-label="Close view exam modal"
              className="absolute top-3 right-3 font-bold text-xl leading-none hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Exam Modal */}
      {showAddModal && (
        <ExamFormModal
          exam={editExam}
          onClose={() => {
            setShowAddModal(false);
            setEditExam(null);
          }}
          onSave={handleSaveExam}
          firstInputRef={firstInputRef}
        />
      )}
    </div>
  );
};

export default Exams;

const ExamFormModal = ({ exam, onClose, onSave, firstInputRef }) => {
  const [form, setForm] = useState(
    exam || {
      id: `E${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`,
      name: "",
      class: "",
      subject: "",
      date: "",
      totalMarks: "",
      status: "Scheduled",
    }
  );

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-form-title"
    >
      <form
        className="bg-white rounded-xl p-6 w-11/12 md:w-1/2 shadow-lg space-y-4 relative"
        onSubmit={handleSubmit}
      >
        <h2 id="exam-form-title" className="text-xl font-bold">
          {exam ? "Edit" : "Add"} Exam
        </h2>
        <button
          onClick={onClose}
          aria-label="Close add or edit exam modal"
          className="absolute top-3 right-3 font-bold text-xl leading-none hover:text-gray-700"
          type="button"
        >
          ×
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Exam Name"
            value={form.name}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
            ref={firstInputRef}
          />
          <input
            type="text"
            name="class"
            placeholder="Class"
            value={form.class}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            value={form.subject}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="number"
            name="totalMarks"
            placeholder="Total Marks"
            value={form.totalMarks}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option>Scheduled</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded-lg"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
          >
            {exam ? "Update" : "Add"} Exam
          </button>
        </div>
      </form>
    </div>
  );
};
