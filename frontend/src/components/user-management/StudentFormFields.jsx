import React, { useEffect, useState, useCallback } from "react";
import InputField from "../form/InputField";
import SelectField from "../form/SelectField";
import adminService from "../../api/adminService";
import Section from "../../layouts/Section";
import { format } from "date-fns"; // 🔑 Import date-fns for formatting

/**
 * StudentFormFields — Production-Ready
 * @param {object} props.formData - The current form data object.
 * @param {function} props.setFormData - Setter function for form data.
 * @param {object} props.errors - Validation errors object.
 * @param {boolean} [props.isEdit=false] - Flag to indicate if the form is in edit mode.
 */
const StudentFormFields = ({
  formData,
  setFormData,
  errors = {},
  isEdit = false,
}) => {
  const [classes, setClasses] = useState([{ value: "", label: "Loading..." }]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  // Helper to update any field safely and handle empty strings/nulls
  const setField = useCallback(
    (name, value) => {
      // Ensure null/undefined values default to an empty string for controlled inputs
      setFormData((prev) => ({ ...prev, [name]: value ?? "" }));
    },
    [setFormData]
  );

  // Load available classes from the API
  useEffect(() => {
    const loadClasses = async () => {
      setLoadingClasses(true);
      try {
        // Assuming adminService.getClasses() returns { classes: [...] }
        const res = await adminService.getClasses();
        const options = res.classes?.length
          ? res.classes.map((cls) => ({
              // Use class unique ID for the value
              value: cls._id,
              // Display name and section
              label: cls.section ? `${cls.name} - ${cls.section}` : cls.name,
            }))
          : [{ value: "", label: "No classes available" }];

        // Add a default 'Select' option at the beginning
        setClasses([
          {
            value: "",
            label: loadingClasses ? "Loading classes..." : "Select Class",
          },
          ...options,
        ]);
      } catch (err) {
        console.error("Failed to load classes:", err);
        setClasses([{ value: "", label: "Failed to load classes" }]);
      } finally {
        setLoadingClasses(false);
      }
    };

    loadClasses();
  }, []);

  // Format date fields for display if initialData provides ISO string
  const formattedDob = formData.dob
    ? formData.dob instanceof Date
      ? format(formData.dob, "yyyy-MM-dd")
      : formData.dob.substring(0, 10)
    : "";

  return (
    <div className="space-y-6">
      {/* Account & Identity Details */}
      <Section title="Account & Identity Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 🔑 REQUIRED FIELD: admissionNumber (for Profile Schema) */}
          <InputField
            label="Admission Number"
            name="admissionNumber"
            required
            placeholder="S-2025-001"
            value={formData.admissionNumber || ""}
            onChange={(e) => setField(e.target.name, e.target.value)}
            error={errors.admissionNumber}
            // If editing, usually this ID cannot be changed
            disabled={isEdit}
          />

          {/* 🔑 REQUIRED FIELD: Student Email (for User Account) */}
          <InputField
            type="email"
            label="Student Email (Login ID)"
            name="email"
            required
            value={formData.email || ""}
            onChange={(e) => setField(e.target.name, e.target.value)}
            error={errors.email}
            // If editing, prevent changing email
            disabled={isEdit}
          />

          {/* 🔑 REQUIRED FIELD: Password (ONLY on Create) */}
          {!isEdit && (
            <InputField
              type="password"
              label="Initial Password"
              name="password"
              required
              placeholder="Set initial password"
              value={formData.password || ""}
              onChange={(e) => setField(e.target.name, e.target.value)}
              error={errors.password}
            />
          )}

          <InputField
            label="Student Phone"
            name="phone"
            required
            type="tel"
            value={formData.phone || ""}
            onChange={(e) => setField(e.target.name, e.target.value)}
            error={errors.phone}
          />

          <InputField
            label="Aadhar Number"
            name="aadharNumber"
            placeholder="1234-5678-9012"
            value={formData.aadharNumber || ""}
            onChange={(e) => setField(e.target.name, e.target.value)}
            error={errors.aadharNumber}
          />
        </div>
      </Section>

      {/* Academic Details */}
      <Section title="Academic Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Roll Number"
            name="rollNumber"
            required
            type="number" // Use type number for roll number
            value={formData.rollNumber || ""}
            onChange={(e) => setField(e.target.name, e.target.value)}
            error={errors.rollNumber}
          />

          <SelectField
            label="Class"
            name="classId"
            required
            value={formData.classId || ""}
            onChange={(val) => setField("classId", val)}
            options={classes}
            loading={loadingClasses}
            disabled={loadingClasses}
            error={errors.classId}
          />

          <InputField
            label="Division / Section"
            name="division"
            placeholder="A, B, or Primary"
            value={formData.division || ""}
            onChange={(e) => setField(e.target.name, e.target.value)}
            error={errors.division}
          />

          <InputField
            label="Academic Year"
            name="academicYear"
            required
            placeholder="2024-2025"
            value={formData.academicYear || ""}
            onChange={(e) => setField(e.target.name, e.target.value)}
            error={errors.academicYear}
          />

          <InputField
            label="Previous School"
            name="previousSchool"
            placeholder="Name of last school attended (if applicable)"
            value={formData.previousSchool || ""}
            onChange={(e) => setField(e.target.name, e.target.value)}
            error={errors.previousSchool}
          />
        </div>
      </Section>

      {/* Basic & Medical Details */}
      <Section title="Basic & Medical Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Full Name"
            name="name"
            required
            value={formData.name || ""}
            onChange={(e) => setField(e.target.name, e.target.value)}
            error={errors.name}
          />

          <SelectField
            label="Gender"
            name="gender"
            required
            value={formData.gender || ""}
            onChange={(val) => setField("gender", val)}
            options={[
              { value: "", label: "Select Gender" },
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "other", label: "Other" },
            ]}
            error={errors.gender}
          />

          <InputField
            type="date"
            label="Date of Birth"
            name="dob"
            required
            // Use formatted date for input value
            value={formattedDob}
            onChange={(e) => setField(e.target.name, e.target.value)}
            error={errors.dob}
          />

          <SelectField
            label="Blood Group"
            name="bloodGroup"
            value={formData.bloodGroup || ""}
            onChange={(val) => setField("bloodGroup", val)}
            options={[
              { value: "", label: "Select Group" },
              { value: "A+", label: "A+" },
              { value: "A-", label: "A-" },
              { value: "B+", label: "B+" },
              { value: "B-", label: "B-" },
              { value: "O+", label: "O+" },
              { value: "O-", label: "O-" },
              { value: "AB+", label: "AB+" },
              { value: "AB-", label: "AB-" },
            ]}
            error={errors.bloodGroup}
          />

          <SelectField
            label="Category"
            name="category"
            value={formData.category || "general"}
            onChange={(val) => setField("category", val)}
            options={[
              { value: "general", label: "General" },
              { value: "obc", label: "OBC" },
              { value: "sc", label: "SC" },
              { value: "st", label: "ST" },
            ]}
            error={errors.category}
          />

          <div className="md:col-span-3">
            <InputField
              isTextArea={true} // Use textarea component for multi-line
              label="Medical Notes"
              name="medicalNotes"
              value={formData.medicalNotes || ""}
              onChange={(e) => setField(e.target.name, e.target.value)}
              rows={3}
              error={errors.medicalNotes}
            />
          </div>
        </div>
      </Section>

      {/* ⚠️ Note: Address fields are intentionally omitted here. 
          In the AddUserModal, they are handled by ParentFormFields 
          since the Parent's Address is typically shared with the Student. 
          If you need separate addresses, they should be included here. */}
    </div>
  );
};

export default StudentFormFields;
