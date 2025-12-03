import React, { useCallback } from "react";
import InputField from "../form/InputField";
import SelectField from "../form/SelectField";
import CheckboxField from "../form/CheckboxField"; // Added for isClassTeacher
import Section from "../../layouts/Section";
import { format } from "date-fns"; // 🔑 Import date-fns for formatting

/**
 * TeacherFormFields (Employee & Teacher Profile)
 * @param {object} props.formData - The current form data object.
 * @param {function} props.setFormData - Setter function for form data.
 * @param {object} props.errors - Validation errors object.
 * @param {boolean} [props.isEdit=false] - Flag to indicate if the form is in edit mode.
 */
const TeacherFormFields = ({
  formData,
  setFormData,
  errors = {},
  isEdit = false,
}) => {
  // Centralized handler for standard input fields
  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      let finalValue = value;

      // Convert number/checkbox types appropriately
      if (type === "number") {
        finalValue = value ? Number(value) : null;
      } else if (type === "checkbox") {
        finalValue = checked;
      }

      setFormData((prev) => ({
        ...prev,
        [name]: finalValue,
      }));
    },
    [setFormData]
  );

  // Handler for comma-separated lists (e.g., Assigned Subjects/Classes)
  const handleListChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({
        ...prev,
        // Convert comma string to an array of trimmed, non-empty values
        [field]: value
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      }));
    },
    [setFormData]
  );

  // Format date fields for display if initialData provides ISO string
  const formattedDob = formData.dob
    ? formData.dob instanceof Date
      ? format(formData.dob, "yyyy-MM-dd")
      : formData.dob.substring(0, 10)
    : "";

  const formattedJoiningDate = formData.joiningDate
    ? formData.joiningDate instanceof Date
      ? format(formData.joiningDate, "yyyy-MM-dd")
      : formData.joiningDate.substring(0, 10)
    : "";

  return (
    <div className="space-y-6">
      {/* ACCOUNT & CONTACT DETAILS */}
      <Section title="Account & Contact Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 🔑 User Email (Login ID) */}
          <InputField
            label="Email (Login ID)"
            type="email"
            name="email"
            required
            placeholder="teacher@example.com"
            value={formData.email || ""}
            onChange={handleChange}
            error={errors.email}
            disabled={isEdit} // Prevent changing email in edit mode
          />

          {/* 🔑 Initial Password (ONLY on Create) */}
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

          {/* Phone Number */}
          <InputField
            label="Phone Number"
            type="tel"
            name="phone"
            required
            placeholder="10-digit number"
            value={formData.phone || ""}
            onChange={handleChange}
            error={errors.phone}
          />

          {/* Emergency Contact */}
          <InputField
            label="Emergency Contact"
            type="tel"
            name="emergencyContact"
            required // Made required as it's critical staff information
            placeholder="Alternate contact number"
            value={formData.emergencyContact || ""}
            onChange={handleChange}
            error={errors.emergencyContact}
          />

          {/* Employee ID */}
          <InputField
            label="Employee ID (T-001)"
            name="employeeId"
            required
            value={formData.employeeId || ""}
            onChange={handleChange}
            error={errors.employeeId}
          />
        </div>
      </Section>

      {/* BASIC & ACADEMIC DETAILS */}
      <Section title="Basic & Professional Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Full Name */}
          <InputField
            label="Full Name"
            name="name"
            required
            placeholder="Teacher full name"
            value={formData.name || ""}
            onChange={handleChange}
            error={errors.name}
          />

          {/* Gender */}
          <SelectField
            label="Gender"
            name="gender"
            required
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

          {/* Date of Birth */}
          <InputField
            type="date"
            label="Date of Birth"
            name="dob"
            required
            value={formattedDob}
            onChange={handleChange}
            error={errors.dob}
          />

          {/* Aadhar Number */}
          <InputField
            label="Aadhar Number"
            name="aadharNumber"
            placeholder="1234-5678-9012"
            value={formData.aadharNumber || ""}
            onChange={handleChange}
            error={errors.aadharNumber}
          />

          {/* Highest Qualification */}
          <InputField
            label="Highest Qualification"
            name="qualification"
            required
            placeholder="B.Ed, M.Sc, PhD..."
            value={formData.qualification || ""}
            onChange={handleChange}
            error={errors.qualification}
          />

          {/* Experience Years */}
          <InputField
            type="number"
            label="Experience (Years)"
            name="experienceYears"
            placeholder="e.g., 5"
            min={0}
            max={50}
            value={formData.experienceYears ?? ""}
            onChange={handleChange}
            error={errors.experienceYears}
          />
        </div>
      </Section>

      {/* ACADEMIC ASSIGNMENTS */}
      <Section title="Academic Assignments">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Assigned Classes (IDs - Comma Separated) */}
          <InputField
            label="Assigned Classes (Comma-Separated IDs)"
            name="assignedClasses"
            placeholder="classId1, classId2"
            value={(formData.assignedClasses || []).join(",")}
            onChange={(e) =>
              handleListChange("assignedClasses", e.target.value)
            }
            error={errors.assignedClasses}
          />

          {/* Assigned Subjects (IDs - Comma Separated) */}
          <InputField
            label="Assigned Subjects (Comma-Separated IDs)"
            name="assignedSubjects"
            placeholder="subjectId1, subjectId2"
            value={(formData.assignedSubjects || []).join(",")}
            onChange={(e) =>
              handleListChange("assignedSubjects", e.target.value)
            }
            error={errors.assignedSubjects}
          />

          {/* 🔑 isClassTeacher Flag */}
          <div className="md:col-span-2 pt-2">
            <CheckboxField
              label="Is this teacher assigned as a Class Teacher?"
              name="isClassTeacher"
              checked={formData.isClassTeacher ?? false} // Default to false
              onChange={handleChange}
              description="If checked, this teacher will have primary management privileges for their assigned class."
            />
          </div>
        </div>
      </Section>

      {/* EMPLOYMENT & ADDRESS DETAILS */}
      <Section title="Employment & Address Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date of Joining */}
          <InputField
            type="date"
            label="Date of Joining"
            name="joiningDate"
            required
            value={formattedJoiningDate}
            onChange={handleChange}
            error={errors.joiningDate}
          />

          {/* Employment Type */}
          <SelectField
            label="Employment Type"
            name="employmentType"
            required
            value={formData.employmentType || ""}
            onChange={handleChange}
            error={errors.employmentType}
            options={[
              { value: "", label: "Select Type" },
              { value: "full-time", label: "Full Time" },
              { value: "part-time", label: "Part Time" },
              { value: "contract", label: "Contract" },
            ]}
          />

          {/* Salary */}
          <InputField
            type="number"
            label="Salary (monthly, optional)"
            name="salary"
            placeholder="e.g., 50000"
            value={formData.salary ?? ""}
            onChange={handleChange}
            error={errors.salary}
          />

          {/* Address */}
          <div className="md:col-span-3">
            <InputField
              isTextArea={true} // Use a multi-line input for address
              label="Full Address"
              name="address"
              required
              placeholder="Street, Area, Landmark"
              value={formData.address || ""}
              onChange={handleChange}
              error={errors.address}
            />
          </div>

          {/* City */}
          <InputField
            label="City"
            name="city"
            required
            value={formData.city || ""}
            onChange={handleChange}
            error={errors.city}
          />

          {/* State */}
          <InputField
            label="State"
            name="state"
            required
            value={formData.state || ""}
            onChange={handleChange}
            error={errors.state}
          />

          {/* Pincode */}
          <InputField
            label="Pincode"
            name="pincode"
            required
            placeholder="6-digit"
            value={formData.pincode || ""}
            onChange={handleChange}
            error={errors.pincode}
          />
        </div>
      </Section>
    </div>
  );
};

export default TeacherFormFields;
