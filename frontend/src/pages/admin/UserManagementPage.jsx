import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import adminService from "../../api/adminService";
import DetailModal from "../../components/user-management/DetailModal"; // 🔑 NEW: For showing user details

import AddUserModal from "../../components/user-management/AddUserModal";
import ConfirmationModal from "../../components/user-management/ConfirmationModal";
import UserTable from "../../components/user-management/UserTable";
import UserStats from "../../components/user-management/UserStats";
import SearchFilter from "../../components/user-management/SearchFilter";

/**
 * Student, Teacher, Admin only.
 * Parent accounts are created through student creation flow.
 */
const AVAILABLE_ROLES = ["student", "teacher", "admin"];

const RoleSelectModal = ({ onSelect, onCancel }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm space-y-4">
      <h2 className="text-xl font-bold text-center">Select Role</h2>

      <div className="grid grid-cols-2 gap-2">
        {AVAILABLE_ROLES.map((role) => (
          <button
            key={role}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => onSelect(role)}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        ))}
      </div>

      <button
        className="mt-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 w-full"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  </div>
);

const normalizeRole = (role) => role?.toLowerCase() || "";

// Utility to map student profiles if needed (e.g., separating parent linkage info)
const mapUserData = (user) => {
  const role = normalizeRole(user.role);

  if (role === "student" && user.profile) {
    return {
      ...user,
      studentProfile: user.profile,
      parentLinked: !!user.parent, // Check if parent field exists/is linked
    };
  }

  return user;
};

const UserManagementPage = () => {
  const { token } = useSelector((state) => state.auth);
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const roleFromQuery = query.get("role");

  const [allUsers, setAllUsers] = useState([]); // 🔑 Stores ALL users for stats (FIX for previous issue)
  const [users, setUsers] = useState([]); // Stores the current page of users
  const [loading, setLoading] = useState(false); // 🔑 Added loading state

  const [pagination, setPagination] = useState({
    totalUsers: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 25,
  });

  const [filterRole, setFilterRole] = useState("all");
  const [selectedRole, setSelectedRole] = useState(""); // Holds role for creation
  const [selectedIds, setSelectedIds] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false); // Add/Edit Modal
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // Holds user data for editing
  const [viewUser, setViewUser] = useState(null); // 🔑 NEW: Holds user data for viewing details

  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    action: null,
    message: "",
  });

  /* ======================================================
    FETCH USERS
  ======================================================= */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // FIX: Use the 'users' endpoint to fetch ALL data first to populate stats
      const resAll = await adminService.getUsers({});
      setAllUsers((resAll.users || []).map(mapUserData));

      // Fetch filtered data for the current view (or reuse resAll if filter is 'all')
      const res =
        filterRole === "all"
          ? resAll
          : await adminService.getUsers({
              role: filterRole.toUpperCase(),
              // Add other search/pagination params here if needed
            });

      const mapped = (res.users || []).map(mapUserData);

      setUsers(mapped);
      setPagination({
        totalUsers: res.pagination?.totalUsers ?? mapped.length,
        totalPages: res.pagination?.totalPages ?? 1,
        currentPage: res.pagination?.currentPage ?? 1,
        limit: res.pagination?.limit ?? 25,
      });
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filterRole]); // Now depends on filterRole to re-fetch/re-filter

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle ?role=... from URL
  useEffect(() => {
    if (roleFromQuery) {
      setSelectedRole(roleFromQuery.toLowerCase());
      setShowRoleSelect(true);
    }
  }, [roleFromQuery]);

  /* ======================================================
    HANDLERS
  ======================================================= */

  const openConfirm = (message, action) =>
    setConfirmation({ isOpen: true, message, action });

  const handleAddUser = (data) => {
    const userRole = selectedRole;
    const message =
      userRole === "student"
        ? `Create new student and parent?`
        : `Create new ${userRole} account?`;

    openConfirm(message, async () => {
      try {
        await adminService.addUser(data, userRole);
        // Reset filter to 'all' or the current role after creation
        setFilterRole(userRole);
        await fetchUsers();
      } catch (err) {
        console.error("Add user failed:", err);
      }

      setIsModalOpen(false);
      setSelectedRole("");
    });
  };

  const handleEditUser = (data) => {
    const userRole = selectedUser?.role?.toLowerCase();

    openConfirm(
      `Save changes for ${selectedUser.name} (${userRole})?`,
      async () => {
        try {
          await adminService.updateUser(selectedUser._id, data, userRole);
          await fetchUsers();
        } catch (err) {
          console.error("Update user failed:", err);
        }

        setIsModalOpen(false);
        setSelectedUser(null);
      }
    );
  };

  const handleDeleteUser = (user) => {
    openConfirm(`Permanently delete ${user.name}?`, async () => {
      try {
        await adminService.deleteUser(user._id);
        await fetchUsers();
        setSelectedIds((prev) => prev.filter((id) => id !== user._id));
      } catch (err) {
        console.error("Delete failed:", err);
      }
    });
  };

  const handleBulkDelete = () => {
    if (!selectedIds.length) return;

    openConfirm(`Delete ${selectedIds.length} user(s)?`, async () => {
      try {
        await adminService.bulkDeleteUsers(selectedIds);
        await fetchUsers();
        setSelectedIds([]);
      } catch (err) {
        console.error("Bulk delete failed:", err);
      }
    });
  };

  // 🔑 NEW: Handler for viewing user details
  const handleViewUser = (user) => {
    setViewUser(user);
  };

  // Memoized list of users to display in the table
  const displayedUsers = useMemo(() => {
    // The current 'users' state already holds the data filtered by the API (or initial fetch)
    // This step is kept simple as filtering happens during fetchUsers() now.
    return users;
  }, [users]);

  /* ======================================================
    UI
  ======================================================= */
  return (
    <main className="p-4 sm:p-8 bg-gray-100 min-h-screen space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
        <p className="text-gray-600">Manage Students, Teachers, and Admins.</p>
      </header>

      {/* 🔑 UserStats now uses the COMPLETE list (allUsers) */}
      <UserStats users={allUsers} loading={loading} />

      <SearchFilter
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        openAddUserModal={() => {
          setSelectedUser(null);
          setShowRoleSelect(true);
        }}
        onBulkDelete={handleBulkDelete}
        selectedCount={selectedIds.length}
        disableBulkDelete={!selectedIds.length}
      />

      {/* 🔑 UserTable uses the currently filtered list (displayedUsers) and includes new handler */}
      <UserTable
        users={displayedUsers}
        loading={loading} // Pass loading state
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onEdit={(u) => {
          setSelectedUser(u);
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteUser}
        onView={handleViewUser} // 🔑 Pass the new handler
      />

      {/* PAGINATION (To be implemented using pagination state) */}
      {/* <div>
          <p className="text-sm text-gray-600">Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalUsers} total users)</p>
      </div> */}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <AddUserModal
          userType={
            selectedUser ? normalizeRole(selectedUser.role) : selectedRole
          }
          token={token}
          initialData={selectedUser}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
            setSelectedRole("");
          }}
          onSave={(data) =>
            selectedUser ? handleEditUser(data) : handleAddUser(data)
          }
        />
      )}

      {/* 🔑 VIEW DETAILS MODAL */}
      {viewUser && (
        <DetailModal user={viewUser} onClose={() => setViewUser(null)} />
      )}

      {/* ROLE SELECT */}
      {showRoleSelect && (
        <RoleSelectModal
          onSelect={(role) => {
            setSelectedRole(role);
            setIsModalOpen(true);
            setShowRoleSelect(false);
          }}
          onCancel={() => setShowRoleSelect(false)}
        />
      )}

      {/* CONFIRMATION MODAL */}
      {confirmation.isOpen && (
        <ConfirmationModal
          message={confirmation.message}
          onConfirm={() => {
            confirmation.action();
            setConfirmation({ isOpen: false, action: null, message: "" });
          }}
          onCancel={() =>
            setConfirmation({ isOpen: false, action: null, message: "" })
          }
        />
      )}
    </main>
  );
};

export default UserManagementPage;
