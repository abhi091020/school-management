// backend/utils/passwordUtils.js

import bcrypt from "bcryptjs";

/* ============================================================
   CONFIG
   - Use BCRYPT_SALT_ROUNDS from env if >=10, else default to 12
============================================================ */
const SALT_ROUNDS =
  Number(process.env.BCRYPT_SALT_ROUNDS) >= 10
    ? Number(process.env.BCRYPT_SALT_ROUNDS)
    : 12;

/* ============================================================
   PASSWORD STRENGTH VALIDATOR
   - Only used when user sets their own password
   - Minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 number
============================================================ */
export function validatePasswordStrength(password) {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
  return strongRegex.test(password);
}

/* ============================================================
   HASH PASSWORD
   - Supports skipValidation for default/system passwords
   - Throws only if skipValidation=false and regex fails
============================================================ */
export const hashPassword = async (password, options = {}) => {
  const { skipValidation = false } = options;

  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }

  // Skip regex validation if flagged
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
   - Safely compares plain and hashed passwords
============================================================ */
export const comparePassword = async (plain, hashed) => {
  if (!plain || !hashed) return false;
  try {
    return await bcrypt.compare(plain, hashed);
  } catch (err) {
    console.error("❌ Password comparison error:", err.message);
    return false;
  }
};

/* ============================================================
   GENERATE SECURE AUTO PASSWORD
   - Always satisfies regex: 8+ chars, uppercase, lowercase, number
============================================================ */
export const generateSecurePassword = () => {
  const rand = Math.random().toString(36).slice(-6); // random 6 chars
  return `S@${rand}1A`; // ensures uppercase and number for regex compliance
};
