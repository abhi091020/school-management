import React, { useEffect, useState } from "react";
import {
  FaSearch,
  FaPlus,
  FaCheck,
  FaTimes,
  FaTrash,
  FaClipboardList,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

/* Toast message */
const MessageBox = ({ type, message, onClose }) => {
  const bgColors = {
    success: "bg-green-100 text-green-800 border-green-400",
    info: "bg-blue-100 text-blue-800 border-blue-400",
    error: "bg-red-100 text-red-800 border-red-400",
  };
  return (
    <div
      className={`fixed top-6 right-6 border px-4 py-3 rounded-lg shadow-lg z-[60] ${bgColors[type]}`}
    >
      <div className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <button onClick={onClose} className="font-bold text-xl leading-none">
          ×
        </button>
      </div>
    </div>
  );
};

/* Confirmation modal */
const ConfirmBox = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[50]">
    <div className="bg-white rounded-xl p-6 w-96 shadow-xl space-y-4">
      <h3 className="text-lg font-bold text-gray-800">Confirm Action</h3>
      <p className="text-gray-600">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-gray-400 hover:bg-gray-500 text-white"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

const LeaveApplication = () => {
  const [leaves, setLeaves] = useState([
    {
      id: "L001",
      name: "Abhishek Bhore",
      role: "Student",
      classOrDept: "Class 10A",
      from: "2025-11-10",
      to: "2025-11-12",
      reason: "Medical leave",
      status: "Approved",
    },
    {
      id: "L002",
      name: "Priya Sharma",
      role: "Teacher",
      classOrDept: "Science Dept.",
      from: "2025-11-15",
      to: "2025-11-17",
      reason: "Family function",
      status: "Pending",
    },
  ]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editLeave, setEditLeave] = useState(null);

  const [confirmBox, setConfirmBox] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2500);
  };

  // Helper to get group category based on leave end date
  const getGroup = (toDateStr) => {
    const toDate = new Date(toDateStr);
    const now = new Date();
    // Normalize times for comparison (set hours to 0)
    const toDay = new Date(
      toDate.getFullYear(),
      toDate.getMonth(),
      toDate.getDate()
    );
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (toDay.getTime() === today.getTime()) return "Today";
    if (toDay.getTime() < today.getTime()) return "Earlier";
    return "Future";
  };

  // Filtered and sorted leaves with date range filter on 'from' date
  const filteredLeaves = leaves
    .filter(
      (l) =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.id.toLowerCase().includes(search.toLowerCase()) ||
        l.classOrDept.toLowerCase().includes(search.toLowerCase())
    )
    .filter((l) => (roleFilter ? l.role === roleFilter : true))
    .filter((l) => (statusFilter ? l.status === statusFilter : true))
    .filter((l) => {
      if (filterFromDate && new Date(l.from) < new Date(filterFromDate))
        return false;
      if (filterToDate && new Date(l.from) > new Date(filterToDate))
        return false;
      return true;
    })
    .sort((a, b) => new Date(b.to) - new Date(a.to)); // Latest first

  // Group leaves by 'Today' and 'Earlier' only (without Yesterday)
  const groupedLeaves = filteredLeaves.reduce((groups, leave) => {
    const group = getGroup(leave.to);
    if (!groups[group]) groups[group] = [];
    groups[group].push(leave);
    return groups;
  }, {});

  /* Confirmed actions */
  const requestStatusChange = (id, newStatus) => {
    const leave = leaves.find((l) => l.id === id);
    if (!leave) return;
    setConfirmBox({
      message: `Are you sure you want to mark "${leave.name}" as ${newStatus}?`,
      onConfirm: () => {
        setLeaves((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
        );
        showToast("success", `Leave marked as ${newStatus}.`);
        setConfirmBox(null);
      },
    });
  };

  const requestDelete = (id) => {
    const leave = leaves.find((l) => l.id === id);
    if (!leave) return;
    setConfirmBox({
      message: `Delete leave record of ${leave.name}? This action can't be undone.`,
      onConfirm: () => {
        setLeaves((prev) => prev.filter((l) => l.id !== id));
        showToast("success", "Leave deleted successfully.");
        setConfirmBox(null);
      },
    });
  };

  const requestSave = (form) => {
    setShowModal(false);
    setTimeout(() => {
      setConfirmBox({
        message: editLeave
          ? `Confirm update for ${form.name}'s leave?`
          : `Add new leave for ${form.name}?`,
        onConfirm: () => {
          if (editLeave) {
            setLeaves((prev) => prev.map((l) => (l.id === form.id ? form : l)));
            showToast("success", "Leave updated successfully.");
          } else {
            const exists = leaves.some((l) => l.id === form.id);
            let newForm = { ...form };
            if (exists) {
              newForm.id = `L${Math.floor(Math.random() * 100000)
                .toString()
                .padStart(3, "0")}`;
            }
            setLeaves((prev) => [...prev, newForm]);
            showToast("success", "New leave added successfully.");
          }
          setEditLeave(null);
          setConfirmBox(null);
        },
      });
    }, 300);
  };

  const requestCancelModal = (hasChanges = false) => {
    if (!hasChanges) {
      setEditLeave(null);
      setShowModal(false);
      return;
    }
    setConfirmBox({
      message: "Discard changes and close the form?",
      onConfirm: () => {
        setEditLeave(null);
        setShowModal(false);
        showToast("info", "Changes discarded.");
        setConfirmBox(null);
      },
    });
  };

  const totals = {
    total: leaves.length,
    pending: leaves.filter((l) => l.status === "Pending").length,
    approved: leaves.filter((l) => l.status === "Approved").length,
    rejected: leaves.filter((l) => l.status === "Rejected").length,
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen relative">
      {toast && (
        <MessageBox
          type={toast.type}
          message={toast.msg}
          onClose={() => setToast(null)}
        />
      )}

      {confirmBox && (
        <ConfirmBox
          message={confirmBox.message}
          onConfirm={confirmBox.onConfirm}
          onCancel={() => setConfirmBox(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Leave Applications</h1>
        <button
          onClick={() => {
            setEditLeave(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition"
        >
          <FaPlus /> Add Leave
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-4">
        <SummaryCard
          icon={<FaClipboardList className="text-blue-600" />}
          label="Total Leaves"
          count={totals.total}
          bg="bg-blue-100"
          text="text-blue-800"
        />
        <SummaryCard
          icon={<FaClock className="text-yellow-600" />}
          label="Pending"
          count={totals.pending}
          bg="bg-yellow-100"
          text="text-yellow-800"
        />
        <SummaryCard
          icon={<FaCheckCircle className="text-green-600" />}
          label="Approved"
          count={totals.approved}
          bg="bg-green-100"
          text="text-green-800"
        />
        <SummaryCard
          icon={<FaTimesCircle className="text-red-600" />}
          label="Rejected"
          count={totals.rejected}
          bg="bg-red-100"
          text="text-red-800"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center gap-2 mb-4">
        <div className="flex items-center gap-2 w-full md:w-1/3 border rounded-lg bg-white px-3 py-2">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="">All Roles</option>
          <option>Student</option>
          <option>Teacher</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="">All Status</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>

        {/* Date range filters */}
        <div className="flex items-center gap-2">
          <label className="text-gray-700">From:</label>
          <input
            type="date"
            value={filterFromDate}
            onChange={(e) => setFilterFromDate(e.target.value)}
            className="border rounded-lg p-2"
          />
          <label className="text-gray-700">To:</label>
          <input
            type="date"
            value={filterToDate}
            onChange={(e) => setFilterToDate(e.target.value)}
            className="border rounded-lg p-2"
          />
        </div>
      </div>

      {/* Leave History: Only 'Today' and 'Earlier' groups */}
      {["Today", "Earlier"].map((groupName) => {
        const groupLeaves = groupedLeaves[groupName];
        if (!groupLeaves || groupLeaves.length === 0) return null;
        return (
          <div key={groupName} className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{groupName}</h2>
            <div className="overflow-x-auto rounded-lg shadow-lg bg-white">
              <table className="w-full border-collapse table-fixed">
                <thead className="bg-gray-200 text-gray-700 uppercase text-sm">
                  <tr>
                    <th className="w-16 px-4 py-3 text-left">ID</th>
                    <th className="w-1/4 px-4 py-3 text-left">Name</th>
                    <th className="w-1/6 px-4 py-3 text-left">Role</th>
                    <th className="w-1/5 px-4 py-3 text-left">Class/Dept</th>
                    <th className="w-1/5 px-4 py-3 text-left">Duration</th>
                    <th className="w-1/4 px-4 py-3 text-left">Status</th>
                    <th className="w-1/6 px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupLeaves.map((l) => (
                    <tr
                      key={l.id}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 font-medium">{l.id}</td>
                      <td className="px-4 py-3">{l.name}</td>
                      <td className="px-4 py-3">{l.role}</td>
                      <td className="px-4 py-3">{l.classOrDept}</td>
                      <td className="px-4 py-3">
                        {l.from} → {l.to}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="px-4 py-3 flex justify-center gap-2">
                        {l.status === "Pending" && (
                          <>
                            <button
                              className="text-green-600 hover:text-green-800"
                              onClick={() =>
                                requestStatusChange(l.id, "Approved")
                              }
                              title="Approve"
                            >
                              <FaCheck />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-800"
                              onClick={() =>
                                requestStatusChange(l.id, "Rejected")
                              }
                              title="Reject"
                            >
                              <FaTimes />
                            </button>
                          </>
                        )}
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => {
                            setEditLeave(l);
                            setShowModal(true);
                          }}
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => requestDelete(l.id)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {showModal && (
        <LeaveModal
          leave={editLeave}
          onClose={(hasChanges) => requestCancelModal(hasChanges)}
          onSave={(form) => requestSave(form)}
        />
      )}
    </div>
  );
};

export default LeaveApplication;

/* Subcomponents */
const StatusBadge = ({ status }) => {
  const colors = {
    Approved: "bg-green-100 text-green-800",
    Pending: "bg-yellow-100 text-yellow-800",
    Rejected: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-sm font-semibold ${
        colors[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
};

const SummaryCard = ({ icon, label, count, bg, text }) => (
  <div
    className={`${bg} rounded-lg shadow hover:shadow-lg transition p-6 flex flex-col items-center`}
  >
    <div className="flex items-center gap-2 text-gray-700 font-semibold">
      {icon}
      {label}
    </div>
    <span className={`text-3xl font-bold mt-2 ${text}`}>{count}</span>
  </div>
);

const LeaveModal = ({ leave, onClose, onSave }) => {
  const initial = {
    id: `L${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(3, "0")}`,
    name: "",
    role: "Student",
    classOrDept: "",
    from: "",
    to: "",
    reason: "",
    status: "Pending",
  };

  const [form, setForm] = useState(leave ? { ...leave } : initial);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm(leave ? { ...leave } : initial);
    setDirty(false);
  }, [leave]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setDirty(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[40]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
        className="bg-white p-6 rounded-xl w-11/12 md:w-1/2 space-y-4 shadow-lg"
      >
        <h2 className="text-xl font-bold">
          {leave ? "Edit Leave" : "Add Leave"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Name"
            className="border p-2 rounded-lg"
            required
          />
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="border p-2 rounded-lg"
          >
            <option>Student</option>
            <option>Teacher</option>
          </select>

          <input
            name="classOrDept"
            value={form.classOrDept}
            onChange={handleChange}
            placeholder="Class / Dept"
            className="border p-2 rounded-lg"
            required
          />
          <input
            name="from"
            value={form.from}
            onChange={handleChange}
            type="date"
            className="border p-2 rounded-lg"
            required
          />
          <input
            name="to"
            value={form.to}
            onChange={handleChange}
            type="date"
            className="border p-2 rounded-lg"
            required
          />
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="border p-2 rounded-lg"
          >
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </div>

        <textarea
          name="reason"
          value={form.reason}
          onChange={handleChange}
          rows="3"
          placeholder="Reason"
          className="w-full border p-2 rounded-lg"
          required
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onClose(dirty)}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            {leave ? "Update" : "Add"} Leave
          </button>
        </div>
      </form>
    </div>
  );
};
