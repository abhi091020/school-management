// src/pages/admin/Fees.jsx
import React, { useState } from "react";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaBell } from "react-icons/fa";

const Fees = () => {
  const [fees, setFees] = useState([
    {
      id: "F001",
      student: "Abhishek Bhore",
      class: "Class 1",
      amount: 5000,
      status: "Paid",
    },
    {
      id: "F002",
      student: "Jane Smith",
      class: "Class 2",
      amount: 4500,
      status: "Overdue",
    },
    {
      id: "F003",
      student: "Alice Brown",
      class: "Class 3",
      amount: 4800,
      status: "Pending",
    },
    {
      id: "F004",
      student: "Bob Green",
      class: "Class 1",
      amount: 5200,
      status: "Paid",
    },
    {
      id: "F005",
      student: "Sara White",
      class: "Class 2",
      amount: 4700,
      status: "Overdue",
    },
  ]);

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editFee, setEditFee] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [reminderSent, setReminderSent] = useState({});

  const filteredFees = fees
    .filter(
      (f) =>
        f.student.toLowerCase().includes(search.toLowerCase()) ||
        f.id.toLowerCase().includes(search.toLowerCase()) ||
        f.class.toLowerCase().includes(search.toLowerCase())
    )
    .filter((f) => (statusFilter ? f.status === statusFilter : true));

  const handleSaveFee = (fee) => {
    if (editFee) {
      setFees((prev) => prev.map((f) => (f.id === fee.id ? fee : f)));
      setEditFee(null);
    } else {
      setFees((prev) => [...prev, fee]);
    }
    setShowAddModal(false);
  };

  const totalFees = fees.reduce((acc, f) => acc + f.amount, 0);
  const pendingFees = fees.filter((f) => f.status === "Pending").length;
  const overdueFees = fees.filter((f) => f.status === "Overdue").length;

  const getStatusBadge = (status) => {
    switch (status) {
      case "Paid":
        return (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-semibold">
            Paid
          </span>
        );
      case "Pending":
        return (
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-semibold">
            Pending
          </span>
        );
      case "Overdue":
        return (
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-semibold">
            Overdue
          </span>
        );
      default:
        return status;
    }
  };

  const isReminderDisabled = (id) => reminderSent[id];

  const handleReminder = (fee) => {
    alert(`Reminder sent to ${fee.student}`);
    setReminderSent((prev) => ({ ...prev, [fee.id]: true }));
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Fees Management</h1>
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition"
          onClick={() => setShowAddModal(true)}
        >
          <FaPlus /> Add Fee
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div
          className="p-6 bg-blue-100 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
          onClick={() => setStatusFilter("")}
        >
          <span className="text-gray-700 font-semibold">
            Total Fees Collected
          </span>
          <span className="text-2xl font-bold mt-2">${totalFees}</span>
        </div>
        <div
          className="p-6 bg-yellow-100 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
          onClick={() => setStatusFilter("Pending")}
        >
          <span className="text-gray-700 font-semibold">Pending Fees</span>
          <span className="text-2xl font-bold mt-2">{pendingFees}</span>
        </div>
        <div
          className="p-6 bg-red-100 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
          onClick={() => setStatusFilter("Overdue")}
        >
          <span className="text-gray-700 font-semibold">Overdue Fees</span>
          <span className="text-2xl font-bold mt-2">{overdueFees}</span>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 mt-4">
        <FaSearch className="text-gray-400" />
        <input
          type="text"
          placeholder="Search by student, ID, or class..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg shadow-lg bg-white">
        <table className="w-full border-collapse table-fixed">
          <thead className="bg-gray-200 text-gray-700 uppercase text-sm">
            <tr>
              <th className="w-20 px-4 py-3 text-left">ID</th>
              <th className="w-1/4 px-4 py-3 text-left">Student</th>
              <th className="w-1/5 px-4 py-3 text-left">Class</th>
              <th className="w-1/6 px-4 py-3 text-left">Amount</th>
              <th className="w-1/6 px-4 py-3 text-left">Status</th>
              <th className="w-1/6 px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFees.map((f) => (
              <tr key={f.id} className="border-t hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium">{f.id}</td>
                <td className="px-4 py-3 flex items-center gap-1">
                  {f.student}
                  {f.status === "Overdue" && (
                    <span className="inline-block w-3 h-3 ml-1 bg-red-600 rounded-full animate-pulse"></span>
                  )}
                </td>
                <td className="px-4 py-3">{f.class}</td>
                <td className="px-4 py-3 font-semibold">${f.amount}</td>
                <td className="px-4 py-3">{getStatusBadge(f.status)}</td>
                <td className="px-4 py-3 flex justify-center gap-2">
                  <button
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-white ${
                      f.status === "Overdue" && !isReminderDisabled(f.id)
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                    disabled={
                      f.status !== "Overdue" || isReminderDisabled(f.id)
                    }
                    onClick={() => handleReminder(f)}
                  >
                    <FaBell /> Reminder
                  </button>
                  <button
                    className="text-yellow-600 hover:text-yellow-800"
                    onClick={() => {
                      setEditFee(f);
                      setShowAddModal(true);
                    }}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() =>
                      setFees((prev) => prev.filter((x) => x.id !== f.id))
                    }
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {filteredFees.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center p-6 text-gray-500">
                  No fee records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition">
          Export CSV
        </button>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition">
          Export Excel
        </button>
        <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition">
          Bulk Delete
        </button>
      </div>

      {/* Modal */}
      {showAddModal && (
        <FeeFormModal
          fee={editFee}
          onClose={() => {
            setShowAddModal(false);
            setEditFee(null);
          }}
          onSave={handleSaveFee}
        />
      )}
    </div>
  );
};

export default Fees;

const FeeFormModal = ({ fee, onClose, onSave }) => {
  const [form, setForm] = useState(
    fee || {
      id: `F${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`,
      student: "",
      class: "",
      amount: "",
      status: "Pending",
    }
  );

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
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
        <h2 className="text-xl font-bold">{fee ? "Edit" : "Add"} Fee</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="student"
            placeholder="Student Name"
            value={form.student}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
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
            type="number"
            name="amount"
            placeholder="Amount"
            value={form.amount}
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
            <option>Paid</option>
            <option>Pending</option>
            <option>Overdue</option>
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
            {fee ? "Update" : "Add"} Fee
          </button>
        </div>
      </form>
    </div>
  );
};
