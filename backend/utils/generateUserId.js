// utils/generateUserId.js (Production-Ready ES Module)

import mongoose from "mongoose";

/* ============================================================================
   COUNTER SCHEMA — Atomic Sequence Generator
   Used across system (Users, Students, etc.)
============================================================================ */
const counterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Exported so other modules (studentService) can reuse it
export const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

/* ============================================================================
   PREFIX MAP — Strict and Centralized
============================================================================ */
const PREFIX_MAP = Object.freeze({
  student: "S",
  teacher: "T",
  parent: "P",
  admin: "A",
  super_admin: "A", // Super admin follows Admin ID prefix
});

/* ============================================================================
   GENERATE USER ID
   Format: PREFIX-YEAR-SEQ
   Example: S-2025-000001
============================================================================ */
export default async function generateUserId(role, options = {}) {
  try {
    if (!role) throw new Error("User role is required for ID generation");

    const normalizedRole = String(role).toLowerCase();

    if (!PREFIX_MAP[normalizedRole]) {
      throw new Error(`Invalid role '${role}' for ID generation`);
    }

    // Allow override (used by student admission numbers)
    const prefix = (options.prefix || PREFIX_MAP[normalizedRole]).toUpperCase();

    // Year — system uses calendar year for User IDs
    const year = new Date().getFullYear();

    // Zero pad (minimum 6 digits for large schools)
    const pad = Number(options.pad) >= 3 ? Number(options.pad) : 6;

    // Counter key — resets each year automatically
    const counterKey = `user-${normalizedRole}-${year}`;

    // Atomic increment ensures concurrency safety
    const counter = await Counter.findOneAndUpdate(
      { key: counterKey },
      { $inc: { seq: 1 } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    const seqNum = String(counter.seq).padStart(pad, "0");

    return `${prefix}-${year}-${seqNum}`;
  } catch (err) {
    console.error("❌ Error generating user ID:", err);
    throw new Error("Could not generate user ID (internal failure)");
  }
}
