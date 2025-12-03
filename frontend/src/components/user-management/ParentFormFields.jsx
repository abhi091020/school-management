import React, { useCallback } from "react";
// Import reusable components for consistency and error handling display
import InputField from "../form/InputField";
import SelectField from "../form/SelectField";
import Section from "../../layouts/Section";

/**
 * ParentFormFields — Production-Ready Version
 */
const ParentFormFields = ({ formData, setFormData, errors = {} }) => {
  // Centralized change handler using useCallback for memoization
  const handleChange = useCallback(
    (e) => {
      const { name, value, type } = e.target;
      let finalValue = value;

      // Handle number type conversion (e.g., Annual Income)
      if (type === "number") {
        finalValue = value ? Number(value) : null;
      }

      setFormData((prev) => ({
        ...prev,
        [name]: finalValue,
      }));
    },
    [setFormData]
  );

  return (
    <div className="space-y-6">
      <Section title="Parent/Guardian Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Parent Email (Used for Parent User Account) */}
          <InputField
            type="email"
            label="Parent Email (Login ID)"
            name="parentEmail"
            required
            placeholder="parent@example.com"
            value={formData.parentEmail || ""}
            onChange={handleChange}
            error={errors.parentEmail}
          />

          {/* Father Name (Required) */}
          <InputField
            label="Father Name"
            name="fatherName"
            required
            value={formData.fatherName || ""}
            onChange={handleChange}
            error={errors.fatherName}
          />

          {/* Father Phone (Required for Parent User Account) */}
          <InputField
            type="tel"
            label="Father Phone"
            name="fatherPhone"
            required
            placeholder="+91-10-digit"
            value={formData.fatherPhone || ""}
            onChange={handleChange}
            error={errors.fatherPhone}
          />

          {/* Mother Name (Required) */}
          <InputField
            label="Mother Name"
            name="motherName"
            required
            value={formData.motherName || ""}
            onChange={handleChange}
            error={errors.motherName}
          />

          {/* Mother Phone (Optional) */}
          <InputField
            type="tel"
            label="Mother Phone"
            name="motherPhone"
            placeholder="+91-10-digit"
            value={formData.motherPhone || ""}
            onChange={handleChange}
            error={errors.motherPhone}
          />

          {/* Emergency Contact Phone (Required for Profile Schema) */}
          <InputField
            type="tel"
            label="Emergency Contact Phone"
            name="emergencyContactPhone"
            required
            placeholder="+91-10-digit"
            value={formData.emergencyContactPhone || ""}
            onChange={handleChange}
            error={errors.emergencyContactPhone}
          />

          {/* Occupation (Optional) */}
          <InputField
            label="Occupation"
            name="occupation"
            value={formData.occupation || ""}
            onChange={handleChange}
            error={errors.occupation}
          />

          {/* Annual Income (Optional, number type) */}
          <InputField
            type="number"
            label="Annual Income (₹)"
            name="annualIncome"
            placeholder="e.g., 500000"
            value={formData.annualIncome ?? ""} // Use nullish coalescing for number input
            onChange={handleChange}
            error={errors.annualIncome}
          />

          {/* Family Status (Select) */}
          <SelectField
            label="Family Status"
            name="familyStatus"
            value={formData.familyStatus || ""}
            onChange={handleChange}
            error={errors.familyStatus}
            options={[
              { value: "", label: "Select Status" },
              { value: "joint", label: "Joint Family" },
              { value: "nuclear", label: "Nuclear Family" },
            ]}
          />
        </div>
      </Section>

      {/* ADDRESS SECTION (Appears once, shared with student profile) */}
      <Section title="Residential Address (Used for Parent & Student)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
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

          <InputField
            label="City"
            name="city"
            required
            value={formData.city || ""}
            onChange={handleChange}
            error={errors.city}
          />

          <InputField
            label="State"
            name="state"
            required
            value={formData.state || ""}
            onChange={handleChange}
            error={errors.state}
          />

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

export default ParentFormFields;
