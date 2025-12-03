import React from "react";
import {
  X,
  User,
  Mail,
  Smartphone,
  Zap,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Link,
} from "lucide-react";

/**
 * DetailModal Component
 * Displays the complete profile details for a selected user with a professional, categorized layout.
 *
 * @param {object} user - The user object to display.
 * @param {function} onClose - Function to close the modal.
 */
const DetailModal = ({ user, onClose }) => {
  if (!user) return null;

  // --- Utility Functions ---
  const formatValue = (value) => (value ? String(value) : "N/A");
  const normalizeRole = (role) => role?.toLowerCase() || "N/A";
  const userRole = normalizeRole(user.role);

  // --- Role Specific Data Getter ---
  // This function organizes data based on the user's role for modular display
  const getRoleSpecificData = (role) => {
    if (role === "student" && user.studentProfile) {
      return [
        { label: "Student ID", value: user.studentProfile.studentId },
        { label: "Class ID", value: user.studentProfile.classId },
        {
          label: "Emergency Contact",
          value: user.studentProfile.emergencyContact,
        },
        {
          label: "Parent Linked",
          value: user.parentLinked ? "Yes" : "No",
          icon: Link,
          color: user.parentLinked ? "text-green-600" : "text-red-600",
        },
      ];
    }
    if (role === "teacher" && user.profile) {
      return [
        { label: "Department", value: user.profile.department },
        {
          label: "Hired Date",
          value: user.profile.hiredDate
            ? new Date(user.profile.hiredDate).toLocaleDateString()
            : "N/A",
        },
        { label: "Expertise", value: user.profile.expertise },
      ];
    }
    return [];
  };

  const roleData = getRoleSpecificData(userRole);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all">
        {/* Header - Fixed & Clear */}
        <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center rounded-t-xl z-10">
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
            <User size={28} className="text-blue-600" />
            {user.name} Profile
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            aria-label="Close details modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body - Structured Layout */}
        <div className="p-6 space-y-8">
          {/* 1. Status and Primary Role Overview */}
          <section className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="text-sm font-medium text-gray-600">Primary Role</p>
              <p className="text-xl font-bold text-blue-800 flex items-center gap-2">
                {userRole === "student" ? (
                  <GraduationCap size={20} />
                ) : (
                  <Briefcase size={20} />
                )}
                {formatValue(
                  userRole.charAt(0).toUpperCase() + userRole.slice(1)
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">
                Account Status
              </p>
              <p
                className={`text-xl font-bold ${
                  user.status === "active" ? "text-green-700" : "text-red-700"
                } flex items-center justify-end gap-2`}
              >
                <Zap size={20} />
                {formatValue(user.status)}
              </p>
            </div>
          </section>

          {/* 2. Contact Information */}
          <DetailSection title="Contact Information" icon={Mail}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem
                label="Email Address"
                value={user.email}
                icon={Mail}
              />
              <DetailItem
                label="Phone Number"
                value={user.phone}
                icon={Smartphone}
              />
              <DetailItem
                label="Date of Birth"
                value={
                  user.dob ? new Date(user.dob).toLocaleDateString() : "N/A"
                }
                icon={Calendar}
              />
              <DetailItem label="Gender" value={user.gender} icon={User} />
            </div>
          </DetailSection>

          {/* 3. Address */}
          <DetailSection title="Location" icon={MapPin}>
            <div className="p-2 bg-gray-50 rounded border text-sm text-gray-700 whitespace-pre-wrap">
              {formatValue(user.address)}
            </div>
          </DetailSection>

          {/* 4. Role-Specific Data */}
          {roleData.length > 0 && (
            <DetailSection
              title={`${
                userRole.charAt(0).toUpperCase() + userRole.slice(1)
              } Details`}
              icon={userRole === "student" ? GraduationCap : Briefcase}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roleData.map((item, index) => (
                  <DetailItem
                    key={index}
                    label={item.label}
                    value={item.value}
                    icon={item.icon}
                    color={item.color}
                  />
                ))}
              </div>
            </DetailSection>
          )}

          {/* 5. System/Meta Data */}
          <section className="text-sm text-gray-500 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1">
              System Info
            </p>
            <p>
              Database ID:{" "}
              <span className="font-mono text-xs text-gray-600">
                {user._id}
              </span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

// Component for grouping sections
const DetailSection = ({ title, icon: Icon, children }) => (
  <section className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-700 border-b pb-1 flex items-center gap-2">
      {Icon && <Icon size={20} className="text-gray-500" />}
      {title}
    </h3>
    {children}
  </section>
);

// Component for a single detail item
const DetailItem = ({ icon: Icon, label, value, color }) => (
  <div className="space-y-0.5">
    <p className="text-xs font-medium text-gray-500 flex items-center">
      {Icon && (
        <Icon
          size={14}
          className={`mr-1 flex-shrink-0 ${color || "text-gray-400"}`}
        />
      )}
      {label}
    </p>
    <p className={`text-sm font-semibold text-gray-800 break-words ${color}`}>
      {value ? formatValue(value) : "N/A"}
    </p>
  </div>
);

export default DetailModal;
