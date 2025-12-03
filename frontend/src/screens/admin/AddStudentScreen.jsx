import React, { useState } from "react";

// Assuming you have an action defined for the backend call
// import { createStudent } from '../../actions/admin/userActions';

// Add props for handling navigation back to the list
const AddStudentScreen = ({ onCancel, onSuccess, classes = [] }) => {
  // Assuming 'classes' array is passed down as props, typically containing { _id, name, section }
  const [formData, setFormData] = useState({
    // Student fields
    name: "",
    email: "",
    classId: "",
    academicYear: new Date().getFullYear().toString(),
    dob: "",
    gender: "male",
    // Guardian fields
    guardianEmail: "",
    fatherName: "",
    motherName: "",
    phone: "", // Added phone field for completeness based on typical student data
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitHandler = (e) => {
    e.preventDefault();
    // 💡 Modern Logic: Call your backend service/dispatch Redux action here
    // dispatch(createStudent(formData)).then(() => onSuccess());

    console.log("Submitting Student Data:", formData);
    // Simulate success for now
    // NOTE: In a real app, you would only call onSuccess() after the API call succeeds.
    alert("Student form submitted! (Check console for data)");
    onSuccess();
  };

  return (
    <div className="card p-4 shadow-sm bg-white">
      <h3 className="mb-4 border-bottom pb-2">➕ Add New Student</h3>
      <form onSubmit={submitHandler}>
        <div className="row">
          {/* ======================= STUDENT DETAILS ======================= */}
          <h4 className="mt-3 mb-3 text-primary">Student Details</h4>

          {/* Student Name */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-control"
              placeholder="Enter full name"
              required
            />
          </div>

          {/* Student Email */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Student Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              placeholder="Enter student email"
              required
            />
          </div>

          {/* Class ID */}
          <div className="col-md-4 mb-3">
            <label className="form-label">Class</label>
            <select
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              className="form-control"
              required
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.section}
                </option>
              ))}
            </select>
          </div>

          {/* Date of Birth */}
          <div className="col-md-4 mb-3">
            <label className="form-label">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          {/* Gender */}
          <div className="col-md-4 mb-3">
            <label className="form-label">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="form-control"
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Academic Year (Readonly/Hidden if backend sets it) */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Academic Year</label>
            <input
              type="text"
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
              className="form-control"
              readOnly
            />
          </div>

          {/* Student Phone */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Student Phone (Optional)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-control"
              placeholder="Optional phone number"
            />
          </div>

          {/* ======================= GUARDIAN DETAILS ======================= */}
          <h4 className="mt-4 mb-3 text-primary border-top pt-3">
            Guardian Details
          </h4>

          {/* Father's Name */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Father's Name</label>
            <input
              type="text"
              name="fatherName"
              value={formData.fatherName}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          {/* Mother's Name */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Mother's Name</label>
            <input
              type="text"
              name="motherName"
              value={formData.motherName}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          {/* Guardian Email */}
          <div className="col-md-12 mb-3">
            <label className="form-label">Guardian/Parent Email</label>
            <input
              type="email"
              name="guardianEmail"
              value={formData.guardianEmail}
              onChange={handleChange}
              className="form-control"
              placeholder="Used for communication and login"
              required
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex justify-content-end mt-4 pt-3 border-top">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary me-2"
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Create Student
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStudentScreen;
