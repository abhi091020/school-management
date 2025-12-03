// src/pages/admin/Classes.jsx
import React, { useState } from "react";
import { FaSearch, FaPlus, FaEye, FaEdit, FaTrash } from "react-icons/fa";

const Classes = () => {
  const [classes, setClasses] = useState([
    {
      id: "C001",
      name: "Class 1A",
      grade: "Grade 1",
      teacher: "Mr. John Doe",
      students: 30,
      status: "Active",
    },
    {
      id: "C002",
      name: "Class 2B",
      grade: "Grade 2",
      teacher: "Ms. Jane Smith",
      students: 28,
      status: "Active",
    },
    {
      id: "C003",
      name: "Class 3C",
      grade: "Grade 3",
      teacher: "Mr. Alex Brown",
      students: 32,
      status: "Inactive",
    },
  ]);

  const [search, setSearch] = useState("");
  const [viewClass, setViewClass] = useState(null);
  const [editClass, setEditClass] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selected, setSelected] = useState([]);

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.teacher.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveClass = (cls) => {
    if (editClass) {
      setClasses((prev) => prev.map((c) => (c.id === cls.id ? cls : c)));
      setEditClass(null);
    } else {
      setClasses((prev) => [...prev, cls]);
    }
    setShowAddModal(false);
  };

  const handleSelect = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleBulkDelete = () => {
    setClasses((prev) => prev.filter((c) => !selected.includes(c.id)));
    setSelected([]);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Classes</h1>
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition"
          onClick={() => setShowAddModal(true)}
        >
          <FaPlus />
          Add Class
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by class or teacher..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option>All Grades</option>
            <option>Grade 1</option>
            <option>Grade 2</option>
            <option>Grade 3</option>
          </select>
          <select className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
      </div>

      {/* Classes Table */}
      <div className="overflow-x-auto rounded-lg shadow-lg bg-white">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-200 text-gray-700 uppercase text-sm">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? classes.map((c) => c.id) : []
                    )
                  }
                  checked={selected.length === classes.length}
                />
              </th>
              <th className="px-6 py-3 text-left">ID</th>
              <th className="px-6 py-3 text-left">Class Name</th>
              <th className="px-6 py-3 text-left">Grade</th>
              <th className="px-6 py-3 text-left">Teacher</th>
              <th className="px-6 py-3 text-left">Students</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClasses.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={selected.includes(c.id)}
                    onChange={() => handleSelect(c.id)}
                  />
                </td>
                <td className="px-6 py-3">{c.id}</td>
                <td className="px-6 py-3">{c.name}</td>
                <td className="px-6 py-3">{c.grade}</td>
                <td className="px-6 py-3">{c.teacher}</td>
                <td className="px-6 py-3">{c.students}</td>
                <td
                  className={`px-6 py-3 font-semibold ${
                    c.status === "Active" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {c.status}
                </td>
                <td className="px-6 py-3 flex justify-center gap-2">
                  <button
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => setViewClass(c)}
                  >
                    <FaEye />
                  </button>
                  <button
                    className="text-yellow-600 hover:text-yellow-800"
                    onClick={() => {
                      setEditClass(c);
                      setShowAddModal(true);
                    }}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() =>
                      setClasses((prev) => prev.filter((x) => x.id !== c.id))
                    }
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {filteredClasses.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center p-6 text-gray-500">
                  No classes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition"
            onClick={handleBulkDelete}
          >
            Delete Selected ({selected.length})
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition">
            Export CSV
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition">
            Export Excel
          </button>
        </div>
      )}

      {/* View Class Modal */}
      {viewClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-11/12 md:w-1/2 shadow-lg">
            <h2 className="text-xl font-bold mb-4">{viewClass.name}</h2>
            <p>
              <strong>ID:</strong> {viewClass.id}
            </p>
            <p>
              <strong>Grade:</strong> {viewClass.grade}
            </p>
            <p>
              <strong>Teacher:</strong> {viewClass.teacher}
            </p>
            <p>
              <strong>Total Students:</strong> {viewClass.students}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={
                  viewClass.status === "Active"
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {viewClass.status}
              </span>
            </p>
            <div className="flex justify-end mt-4">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded-lg"
                onClick={() => setViewClass(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Class Modal */}
      {showAddModal && (
        <ClassFormModal
          cls={editClass}
          onClose={() => {
            setShowAddModal(false);
            setEditClass(null);
          }}
          onSave={handleSaveClass}
        />
      )}
    </div>
  );
};

export default Classes;

// Reusable Add/Edit Class Modal
const ClassFormModal = ({ cls, onClose, onSave }) => {
  const [form, setForm] = useState(
    cls || {
      id: `C${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`,
      name: "",
      grade: "",
      teacher: "",
      students: 0,
      status: "Active",
    }
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <form
        className="bg-white rounded-xl p-6 w-11/12 md:w-1/2 shadow-lg space-y-4"
        onSubmit={handleSubmit}
      >
        <h2 className="text-xl font-bold">{cls ? "Edit" : "Add"} Class</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Class Name"
            value={form.name}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="text"
            name="grade"
            placeholder="Grade/Section"
            value={form.grade}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="text"
            name="teacher"
            placeholder="Assigned Teacher(s)"
            value={form.teacher}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="number"
            name="students"
            placeholder="Total Students"
            value={form.students}
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
            <option>Active</option>
            <option>Inactive</option>
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
            {cls ? "Update" : "Add"} Class
          </button>
        </div>
      </form>
    </div>
  );
};
