import React, { useCallback } from "react";
import InputField from "./InputField"; // Assuming InputField handles label, error, etc.
import SelectField from "./SelectField"; // Assuming SelectField handles label, options, etc.
import Section from "../layouts/Section"; // Use the Section component for structure

/**
 * UserForm — User Account Details (Shared Across All Roles)
 * This component is primarily used when updating a user's core credentials or status.
 * * @param {object} props.formData - The current form data object.
 * @param {function} props.setFormData - Setter function for form data.
 * @param {object} [props.errors={}] - Validation errors object.
 * @param {boolean} [props.isEdit=false] - Flag to indicate if the form is in edit mode.
 */
const UserForm = ({ formData, setFormData, errors = {}, isEdit = false }) => {
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    [setFormData]
  );

  // Conditionally render the Address fields based on role, as many profiles (Student/Admin)
  // might duplicate this in their specific forms. For a general User update, we keep them optional here.
  const showAddressFields = isEdit;

  return (
    <div className="space-y-6">
      {/* ACCOUNT DETAILS */}
      <Section title="User Account Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <InputField
            label="Full Name"
            name="name"
            required // Name is required for the user account model
            placeholder="e.g., Jane Doe"
            value={formData.name || ""}
            onChange={handleChange}
            error={errors.name}
          />

          {/* Email (Login ID) */}
          <InputField
            type="email"
            label="Email (Login ID)"
            name="email"
            required
            placeholder="user@example.com"
            value={formData.email || ""}
            onChange={handleChange}
            error={errors.email}
            // Prevent changing email in edit mode unless specific permission is granted
            disabled={isEdit}
          />

          {/* 🔑 Password (Required only on Create) */}
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

          {/* Phone (Main Contact) */}
          <InputField
            type="tel"
            label="Phone Number"
            name="phone"
            placeholder="Optional"
            value={formData.phone || ""}
            onChange={handleChange}
            error={errors.phone}
          />

          {/* Role (Display Only) */}
          <InputField
            label="User Role"
            name="role"
            value={formData.role || ""}
            disabled
            placeholder="Role"
            description={`Cannot change role here. Current role: ${formData.role}`}
          />

          {/* Status (User State) */}
          <SelectField
            label="Account Status"
            name="status"
            required
            value={formData.status || "active"}
            onChange={handleChange}
            error={errors.status}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive (Locked)" },
            ]}
          />
        </div>
      </Section>

      {/* OPTIONAL: Basic Address/Metadata for general user profile updates */}
      {showAddressFields && (
        <Section title="General Contact Info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              isTextArea={true}
              label="Address"
              name="address"
              placeholder="Street, City, State"
              value={formData.address || ""}
              onChange={handleChange}
              error={errors.address}
            />

            <InputField
              label="Date of Birth"
              type="date"
              name="dob"
              placeholder="YYYY-MM-DD"
              value={formData.dob || ""}
              onChange={handleChange}
              error={errors.dob}
            />
          </div>
        </Section>
      )}
    </div>
  );
};

export default UserForm;
