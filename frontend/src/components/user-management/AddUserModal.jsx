import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FaTimes } from "react-icons/fa";

import StudentFormFields from "./StudentFormFields";
import ParentFormFields from "./ParentFormFields";
import adminService from "../../api/adminService";

const AddUserModal = ({ userType, onClose, onSave, initialData = null }) => {
  const normalizedType = userType?.toLowerCase();
  const isStudentFlow = normalizedType === "student";

  const { user } = useSelector((state) => state.auth);

  /* ------------------------ DEFAULT FORM & STATE ------------------------ */

  const defaultForm = {
    // --- Student User Fields ---
    name: "",
    email: "",
    phone: "",
    password: "", // 🔑 ADDED: Required for User creation
    // --- Student Profile Fields ---
    admissionNumber: "", // 🔑 ADDED: Required by backend logic (S2025003 example)
    classId: "",
    rollNumber: "",
    academicYear: "",
    division: "",
    previousSchool: "",
    gender: "",
    dob: "",
    bloodGroup: "",
    aadharNumber: "",
    category: "",
    medicalNotes: "",
    // --- Parent Profile Fields ---
    parentEmail: "", // 🔑 IMPORTANT: This should be used for the Parent's User email
    fatherName: "",
    fatherPhone: "",
    motherName: "",
    motherPhone: "",
    occupation: "",
    annualIncome: null,
    familyStatus: "",
    emergencyContactPhone: "",
    // --- Shared Address Fields ---
    address: "",
    city: "",
    state: "",
    pincode: "",
  };

  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    // Apply initial data if in edit mode
    if (initialData)
      setForm((prev) => ({ ...defaultForm, ...prev, ...initialData }));
  }, [initialData]);

  /* ------------------------ VALIDATION ------------------------ */
  const validateForm = (data, isEdit) => {
    const errs = {};

    // Fields required for BOTH Create and Edit
    const requiredCommon = [
      "name",
      "email",
      "phone",
      "classId",
      "rollNumber",
      "academicYear",
      "gender",
      "dob",
      "fatherName",
      "fatherPhone",
      "motherName",
      "address",
      "city",
      "state",
      "pincode",
      "emergencyContactPhone",
      "parentEmail",
    ];

    // Fields required ONLY for Create
    if (!isEdit) {
      requiredCommon.push("password");
      requiredCommon.push("admissionNumber"); // Assuming this is generated or manually entered on create
    }

    requiredCommon.forEach((f) => {
      if (!data[f] || data[f].toString().trim() === "") {
        errs[f] = `${f} is required`;
      }
    });

    // Basic format checks (optional but recommended for prod)
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errs.email = "Invalid email format";
    }
    if (
      data.parentEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.parentEmail)
    ) {
      errs.parentEmail = "Invalid parent email format";
    }

    return errs;
  };

  /* ------------------------ PAYLOAD BUILDER ------------------------ */
  const buildStudentParentPayload = (data) => {
    // Note: The backend handles password hashing and userId generation.
    return {
      user: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password, // 🔑 ADDED
        role: "student",
        status: data.status || "active",
      },
      student: {
        admissionNumber: data.admissionNumber, // 🔑 ADDED
        classId: data.classId,
        rollNumber: data.rollNumber,
        academicYear: data.academicYear,
        division: data.division || "",
        previousSchool: data.previousSchool || "",
        gender: data.gender,
        dob: data.dob,
        bloodGroup: data.bloodGroup || "",
        aadharNumber: data.aadharNumber || "",
        category: data.category || "",
        medicalNotes: data.medicalNotes || "",
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
      },
      parent: {
        // 🔑 Parent User details for its own User account
        user: {
          email: data.parentEmail,
          name: data.fatherName, // Using father's name for parent User name
          phone: data.fatherPhone,
          role: "parent",
          password: data.password || "School@2025", // Default password if none provided
        },
        fatherName: data.fatherName,
        fatherPhone: data.fatherPhone,
        motherName: data.motherName,
        motherPhone: data.motherPhone || "",
        occupation: data.occupation || "",
        annualIncome: data.annualIncome || null,
        familyStatus: data.familyStatus || "",
        emergencyContactPhone: data.emergencyContactPhone,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
      },
    };
  };

  /* ------------------------ SUBMIT ------------------------ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    const isEdit = !!initialData;

    const validationErrors = validateForm(form, isEdit);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      const payload = buildStudentParentPayload(form);
      let response;

      if (isEdit) {
        // Note: Update logic must be refactored to handle Student and Parent profile updates separately
        // For simplicity, we assume one endpoint handles the primary student profile update.
        response = await adminService.updateStudent(initialData._id, payload);
      } else {
        // 🔑 API CALL: POST /api/admin/users/students
        response = await adminService.addStudentAndParent(payload);
      }

      onSave(response.data);
      onClose();
    } catch (err) {
      console.error("Save user failed:", err);
      // Enhanced error handling to display specific validation messages from the backend
      const message = err.response?.data?.message || err.message;
      setApiError(message || "Failed to save student and parent");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------ RENDER ------------------------ */
  if (!isStudentFlow)
    return (
      <div className="p-8 text-red-600">
        Invalid user type. Only Student creation is supported by this modal.
      </div>
    );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-11/12 max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b">
          <h2 className="text-2xl font-bold">
            {initialData ? "Edit Student" : "Add New Student"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* API error */}
        {apiError && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 mt-2 border border-red-300">
            {apiError}
          </div>
        )}

        {/* Form */}
        <div className="flex-1 overflow-y-auto pt-4">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Student & User Fields */}
            <StudentFormFields
              formData={form}
              setFormData={setForm}
              errors={errors}
              isEdit={!!initialData}
            />

            {/* Parent Fields */}
            <ParentFormFields
              formData={form}
              setFormData={setForm}
              errors={errors}
            />

            <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-6 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition-colors"
                disabled={loading}
              >
                {loading
                  ? initialData
                    ? "Saving..."
                    : "Creating..."
                  : initialData
                  ? "Save Changes"
                  : "Create Student + Parent"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
