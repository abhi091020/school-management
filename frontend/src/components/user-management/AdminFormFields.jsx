import React, { useCallback } from "react";
import InputField from "../form/InputField";
import SelectField from "../form/SelectField";
import Section from "../../layouts/Section";
import CheckboxField from "../form/CheckboxField"; // 👈 Added for permissions/flags

/**
 * AdminFormFields (Non-teaching staff / Employee)
 * This component handles input for the User and linked Employee Profile.
 */
const AdminFormFields = ({
  formData,
  setFormData,
  errors = {},
  isEdit = false,
}) => {
  // Note: 'errors' and 'isEdit' are added to props for better integration and future use.

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    },
    [setFormData]
  );

  return (
    <div className="space-y-6">
      {/* ACCOUNT & IDENTITY DETAILS */}
      <Section title="Account & Identity Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 🔑 REQUIRED FIELD: employeeId */}
          <InputField
            label="Employee/Admin ID"
            name="employeeId" // 🔑 Mongoose Path: profile.employeeId
            required
            placeholder="A-001 or E-123"
            value={formData.employeeId || ""}
            onChange={handleChange}
            error={errors.employeeId}
          />

          {/* 🔑 REQUIRED FIELD: email (for User account) */}
          <InputField
            type="email"
            label="Email (Login ID)"
            name="email"
            required
            placeholder="admin@example.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            disabled={isEdit} // Prevent changing email in edit mode for security
          />

          {/* 🔑 REQUIRED FIELD: password (ONLY on Create) */}
          {!isEdit && (
            <InputField
              type="password"
              label="Initial Password"
              name="password"
              required
              placeholder="Set initial password"
              value={formData.password || ""}
              onChange={handleChange}
              error={errors.password}
            />
          )}
        </div>
      </Section>

      {/* PERSONAL DETAILS (PROFILE FIELDS) */}
      <Section title="Personal & Contact Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 🔑 REQUIRED FIELD: name (for User and Profile) */}
          <InputField
            label="Full Name"
            name="name"
            required
            placeholder="e.g., Ramesh Sharma"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
          />

          <InputField
            type="tel"
            label="Phone Number"
            name="phone"
            required
            placeholder="10-digit mobile number"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
          />

          <SelectField
            label="Gender"
            name="gender"
            value={formData.gender || ""}
            onChange={handleChange}
            error={errors.gender}
            options={[
              { value: "", label: "Select Gender" },
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "other", label: "Other" },
            ]}
          />

          <InputField
            label="Aadhar Number"
            name="aadharNumber"
            placeholder="1234-5678-9012"
            value={formData.aadharNumber || ""}
            onChange={handleChange}
            error={errors.aadharNumber}
          />

          {/* 🔑 REQUIRED FIELD: emergencyContactName */}
          <InputField
            label="Emergency Contact Name"
            name="emergencyContactName" // 🔑 Mongoose Path: profile.emergencyContactName
            required
            placeholder="Contact person's full name"
            value={formData.emergencyContactName || ""}
            onChange={handleChange}
            error={errors.emergencyContactName}
          />

          {/* 🔑 REQUIRED FIELD: emergencyContactPhone */}
          <InputField
            type="tel"
            label="Emergency Contact Phone"
            name="emergencyContactPhone" // 🔑 Mongoose Path: profile.emergencyContactPhone
            required
            placeholder="10-digit emergency number"
            value={formData.emergencyContactPhone || ""}
            onChange={handleChange}
            error={errors.emergencyContactPhone}
          />
        </div>
      </Section>

      {/* JOB DETAILS */}
      <Section title="Job & Department Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 🔑 REQUIRED FIELD: designation */}
          <InputField
            label="Position / Designation"
            name="designation" // 🔑 Mongoose Path: profile.designation (Renamed from 'position')
            required
            placeholder="Clerk, Accountant, Office Admin"
            value={formData.designation || ""}
            onChange={handleChange}
            error={errors.designation}
          />

          <InputField
            label="Department"
            name="department" // Mongoose Path: profile.department
            placeholder="Accounts, HR, Back Office"
            value={formData.department || ""}
            onChange={handleChange}
            error={errors.department}
          />

          {/* 🔑 REQUIRED FIELD: joiningDate */}
          <InputField
            type="date"
            label="Date of Joining"
            name="joiningDate" // 🔑 Mongoose Path: profile.joiningDate (Renamed from 'joinDate')
            required
            value={formData.joiningDate || ""}
            onChange={handleChange}
            error={errors.joiningDate}
          />

          {/* PERMISSION CHECKBOXES (Flags from Employee Model) */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4 pt-2">
            <CheckboxField
              label="Full-Time Employee"
              name="isFullTime"
              checked={formData.isFullTime ?? true} // Default to true
              onChange={handleChange}
            />
            <CheckboxField
              label="Can Manage Users"
              name="canManageUsers"
              checked={formData.canManageUsers ?? false}
              onChange={handleChange}
              description="Grants permission to view and manage certain user lists."
            />
          </div>
        </div>
      </Section>

      {/* ADDRESS */}
      <Section title="Address Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <InputField
              label="Full Address"
              name="address"
              required
              placeholder="Street, Area, Landmark"
              value={formData.address}
              onChange={handleChange}
              error={errors.address}
            />
          </div>

          <InputField
            label="City"
            name="city"
            required
            value={formData.city}
            onChange={handleChange}
            error={errors.city}
          />

          <InputField
            label="State"
            name="state"
            required
            value={formData.state}
            onChange={handleChange}
            error={errors.state}
          />

          <InputField
            label="Pincode"
            name="pincode"
            required
            placeholder="6-digit"
            value={formData.pincode}
            onChange={handleChange}
            error={errors.pincode}
          />
        </div>
      </Section>
    </div>
  );
};

export default AdminFormFields;
