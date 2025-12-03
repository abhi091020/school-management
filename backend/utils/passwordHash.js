// backend/utils/passwordUtils.js

import bcrypt from "bcryptjs";

/* ============================================================
   CONFIG
   - Fallback to 12 rounds if env variable invalid
============================================================ */
const SALT_ROUNDS =
  Number(process.env.BCRYPT_SALT_ROUNDS) >= 10
    ? Number(process.env.BCRYPT_SALT_ROUNDS)
    : 12;

/* ============================================================
   PASSWORD STRENGTH VALIDATOR
   - Minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 number
============================================================ */
export function validatePasswordStrength(password) {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
  return strongRegex.test(password);
}

/* ============================================================
   HASH PASSWORD
   - Supports skipValidation for default/system passwords
============================================================ */
export const hashPassword = async (password, options = {}) => {
  const { skipValidation = false } = options;

  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }

  if (!skipValidation && !validatePasswordStrength(password)) {
    throw new Error(
      "Password must be at least 8 characters long, include upper/lowercase letters and numbers"
    );
  }

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (err) {
    console.error("❌ Password hashing error:", err.message);
    throw new Error("Internal error hashing password");
  }
};

/* ============================================================
   COMPARE PASSWORD
============================================================ */
export const comparePassword = async (plainPassword, hashedPassword) => {
  if (!plainPassword || !hashedPassword) return false;
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (err) {
    console.error("❌ Password comparison error:", err.message);
    return false;
  }
};

/* ============================================================
   GENERATE SECURE AUTO PASSWORD
   - Always satisfies regex: at least 8 chars, uppercase, lowercase, number
============================================================ */
export const generateSecurePassword = () => {
  const rand = Math.random().toString(36).slice(-6); // 6 random chars
  return `S@${rand}1A`; // ensures uppercase + number to satisfy regex
};
