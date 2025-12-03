// utils/generateAdmissionNumber.js
import mongoose from "mongoose";

/* -----------------------------------------------
    Counter Schema (shared with generateUserId)
----------------------------------------------- */
const counterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

/* -----------------------------------------------
   Extract starting year from academicYear
----------------------------------------------- */
const extractYear = (academicYear) => {
  if (!academicYear) throw new Error("academicYear is required.");

  const str = String(academicYear);

  if (str.includes("-")) {
    const [year] = str.split("-");
    return parseInt(year.trim());
  }

  return parseInt(str.trim());
};

/* -----------------------------------------------
    Generate Admission Number
    Format: AD-{CLASS_NAME}-{YEAR}-{SEQ}
----------------------------------------------- */
export default async function generateAdmissionNumber(className, academicYear) {
  if (!className) throw new Error("className is required for admission number");

  const year = extractYear(academicYear);
  const cleanClass = className.replace(/\s+/g, "").toUpperCase();

  const key = `admission-${cleanClass}-${year}`;

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).lean();

  if (!counter || typeof counter.seq !== "number") {
    throw new Error("Failed to generate admission number");
  }

  const seq = String(counter.seq).padStart(6, "0");

  return `AD-${cleanClass}-${year}-${seq}`;
}
