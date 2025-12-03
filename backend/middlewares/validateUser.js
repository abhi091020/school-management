import { body, param, validationResult } from "express-validator";
import logger from "../utils/logger.js";

/* ============================================================================
   HELPERS
============================================================================ */
const toTitleCase = (str) =>
  String(str || "")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

const trimString = (value) =>
  typeof value === "string" ? value.trim() : value;

const phoneRegex = /^(\+?\d{1,3})?\d{10}$/;

/* ============================================================================
   VALIDATION HANDLER
============================================================================ */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  logger.warn({
    message: "Validation failed",
    errors: errors.array(),
    body: req.body,
  });

  return res.status(422).json({
    success: false,
    message: "Validation failed",
    errors: errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
    })),
  });
};

/* ============================================================================
   ADMIN / TEACHER CREATION
============================================================================ */
// 🔥 FIX APPLIED HERE: Changing validation to look for fields inside the 'user' object.
export const validateCreateUser = [
  body("user.name") // <-- FIXED
    .exists({ checkFalsy: true })
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters")
    .customSanitizer(trimString)
    .customSanitizer(toTitleCase),

  body("user.email") // <-- FIXED
    .exists({ checkFalsy: true })
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("user.role") // <-- FIXED
    .exists({ checkFalsy: true })
    .withMessage("Role is required")
    .isIn(["admin", "teacher"])
    .withMessage("Role must be admin or teacher"),

  body("user.phone") // <-- FIXED (Optional)
    .optional()
    .matches(phoneRegex)
    .withMessage("Invalid phone format"),

  // --- ADDED PASSWORD VALIDATION ---
  body("user.password") // Assuming password is required for new users
    .exists({ checkFalsy: true })
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  // --- ADDED PROFILE VALIDATION ---
  body("profile.employeeId")
    .exists({ checkFalsy: true })
    .withMessage("Employee ID is required"),

  body("profile.designation")
    .exists({ checkFalsy: true })
    .withMessage("Designation is required"),

  body("profile.joiningDate")
    .exists({ checkFalsy: true })
    .withMessage("Joining date is required")
    .isISO8601()
    .withMessage("Invalid joining date format"),

  handleValidation,
];

/* ============================================================================
   STUDENT CREATION (Nested DTO)
============================================================================ */
export const validateCreateStudent = [
  // USER FIELDS (user.*)
  body("user.name")
    .exists({ checkFalsy: true })
    .withMessage("Student name is required")
    .customSanitizer(trimString)
    .customSanitizer(toTitleCase),

  body("user.email")
    .exists({ checkFalsy: true })
    .withMessage("Student email is required")
    .isEmail()
    .withMessage("Invalid student email")
    .normalizeEmail(),

  body("user.phone")
    .optional()
    .matches(phoneRegex)
    .withMessage("Invalid phone format"),

  // ADDED PASSWORD VALIDATION FOR STUDENT USER
  body("user.password")
    .exists({ checkFalsy: true })
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  // STUDENT FIELDS (student.*)
  body("student.classId")
    .exists({ checkFalsy: true })
    .withMessage("classId is required")
    .isMongoId()
    .withMessage("Invalid classId"),

  body("student.rollNumber")
    .exists({ checkFalsy: true })
    .withMessage("Roll number is required")
    .isNumeric()
    .withMessage("Roll number must be numeric"),

  body("student.academicYear")
    .exists({ checkFalsy: true })
    .withMessage("Academic year is required")
    .isString(), // Assuming year is a string like '2024-2025'

  // admission Number may be auto-generated
  body("student.admissionNumber")
    .optional()
    .isString()
    .withMessage("Admission number must be a string"),

  // PARENT FIELDS (parent.*)
  body("parent.fatherName")
    .exists({ checkFalsy: true })
    .withMessage("Father name is required")
    .customSanitizer(toTitleCase),

  body("parent.motherName")
    .exists({ checkFalsy: true })
    .withMessage("Mother name is required")
    .customSanitizer(toTitleCase),

  body("parent.email")
    .optional()
    .isEmail()
    .withMessage("Invalid parent email")
    .normalizeEmail(),

  body("parent.fatherPhone")
    .optional()
    .matches(phoneRegex)
    .withMessage("Invalid father phone number"),

  body("parent.motherPhone")
    .optional()
    .matches(phoneRegex)
    .withMessage("Invalid mother phone number"),

  handleValidation,
];

/* ============================================================================
    STANDALONE PARENT CREATION (Nested DTO) 🚀 NEW
============================================================================ */
export const validateCreateParentOnly = [
  // USER FIELDS (user.*)
  body("user.name")
    .exists({ checkFalsy: true })
    .withMessage("Parent name is required")
    .customSanitizer(trimString)
    .customSanitizer(toTitleCase),

  body("user.email")
    .exists({ checkFalsy: true })
    .withMessage("Parent email is required")
    .isEmail()
    .withMessage("Invalid parent email")
    .normalizeEmail(),

  body("user.role")
    .exists({ checkFalsy: true })
    .withMessage("Role is required")
    .equals("parent")
    .withMessage("Role must be 'parent'"),

  body("user.phone")
    .optional()
    .matches(phoneRegex)
    .withMessage("Invalid phone format"),

  // ADDED PASSWORD VALIDATION FOR PARENT USER
  body("user.password")
    .exists({ checkFalsy: true })
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  // PARENT PROFILE FIELDS (parent.*)
  body("parent.fatherName")
    .exists({ checkFalsy: true })
    .withMessage("Father name is required")
    .customSanitizer(toTitleCase),

  body("parent.motherName")
    .exists({ checkFalsy: true })
    .withMessage("Mother name is required")
    .customSanitizer(toTitleCase),

  body("parent.email") // Profile email can be optional if User email is used
    .optional()
    .isEmail()
    .withMessage("Invalid parent profile email")
    .normalizeEmail(),

  body("parent.fatherPhone")
    .optional()
    .matches(phoneRegex)
    .withMessage("Invalid father phone number"),

  body("parent.motherPhone")
    .optional()
    .matches(phoneRegex)
    .withMessage("Invalid mother phone number"),

  // Ensure one of the phone numbers is present if user.phone is missing
  body("parent").custom((value, { req }) => {
    if (!req.body.user.phone && !value.fatherPhone && !value.motherPhone) {
      throw new Error(
        "A phone number is required for the user: either user.phone, parent.fatherPhone, or parent.motherPhone must be provided."
      );
    }
    return true;
  }),

  handleValidation,
];

/* ============================================================================
   UPDATE USER
============================================================================ */
export const validateUpdateUser = [
  body("name").optional().isString().customSanitizer(toTitleCase),
  body("email").optional().isEmail().normalizeEmail(),
  body("phone").optional().matches(phoneRegex),
  body("role").optional().isIn(["admin", "teacher", "super_admin"]),
  handleValidation,
];

/* ============================================================================
   FIXED — ID PARAM VALIDATION
============================================================================ */
export const validateIdParam = [
  async (req, res, next) => {
    await param("id").isMongoId().withMessage("Invalid ID format").run(req);
    next();
  },
  handleValidation,
];
