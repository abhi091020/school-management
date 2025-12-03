// backend/utils/recycleUtils.js
import Parent from "../models/admin/Parent.js";
import Student from "../models/admin/Student.js";
import Class from "../models/admin/Class.js";
import User from "../models/admin/User.js";

/* --------------------------------------------- */
/* Safe Deep Serializer                          */
/* --------------------------------------------- */
const serializeValue = (val, visited = new WeakMap()) => {
  if (val === null || val === undefined) return val;

  if (typeof val === "object" && visited.has(val)) return visited.get(val);

  if (val?._bsontype === "ObjectId") return String(val);
  if (typeof val === "object" && "$oid" in val) return String(val.$oid);

  if (val instanceof Date) return new Date(val.getTime());

  if (Array.isArray(val)) {
    const out = [];
    visited.set(val, out);
    for (const item of val) out.push(serializeValue(item, visited));
    return out;
  }

  if (typeof val === "object") {
    const out = {};
    visited.set(val, out);
    for (const key in val) out[key] = serializeValue(val[key], visited);
    return out;
  }

  return val;
};

/* --------------------------------------------- */
/* Actor Snapshot                                */
/* --------------------------------------------- */
export const buildActorSnapshot = (actor) => {
  if (!actor) return { name: "System", email: "-", role: "-" };

  return {
    name: actor.name || "Unknown",
    email: actor.email || "-",
    role: actor.role || "-",
  };
};

/* --------------------------------------------- */
/* normalizeSnapshot — ASYNC                     */
/* --------------------------------------------- */
export const normalizeSnapshot = async (snapshot) => {
  if (!snapshot) return null;

  const clone = serializeValue(snapshot);

  /* Normalize IDs */
  if (clone._id) clone._id = String(clone._id);
  if (clone.id) clone.id = String(clone.id);
  if (clone.userId) clone.userId = String(clone.userId);

  /* ------------------------------------------------------- */
  /* Load USER record → fix email + name                     */
  /* ------------------------------------------------------- */
  if (clone.userId) {
    try {
      const userDoc = await User.findOne({ userId: clone.userId })
        .setOptions({ includeDeleted: true })
        .lean();

      if (userDoc) {
        clone.name = userDoc.name || clone.name;
        clone.email = userDoc.email || clone.email || "-";
      } else {
        if (!clone.email) clone.email = "-";
      }
    } catch {
      if (!clone.email) clone.email = "-";
    }
  } else {
    if (!clone.email) clone.email = "-";
  }

  /* Name fallback */
  if (!clone.name) {
    clone.name =
      clone.fullName ||
      clone.fatherName ||
      clone.motherName ||
      clone.admissionNumber ||
      clone.userId ||
      "Unknown";
  }

  const isStudent = clone.admissionNumber && clone.parent;
  const isParent = Array.isArray(clone.children);

  /* =====================================================================
     STUDENT SNAPSHOT FIX
     ===================================================================== */
  if (isStudent) {
    /* Resolve parent name */
    if (clone.parent) {
      try {
        const parentDoc = await Parent.findById(clone.parent)
          .setOptions({ includeDeleted: true })
          .lean();

        if (parentDoc) {
          const parentUser = await User.findOne({ userId: parentDoc.userId })
            .setOptions({ includeDeleted: true })
            .lean();

          clone.parentNameResolved =
            parentUser?.name || parentDoc.fatherName || parentDoc.userId || "-";
        } else {
          clone.parentNameResolved = "-";
        }
      } catch {
        clone.parentNameResolved = "-";
      }
    }

    /* REMOVE raw parent ObjectId */
    delete clone.parent;

    /* Resolve class name */
    if (clone.classId) {
      try {
        const classDoc = await Class.findById(clone.classId)
          .setOptions({ includeDeleted: true })
          .lean();

        clone.classId = classDoc
          ? `Class: ${classDoc.name} ${classDoc.section}`
          : `Class: ${clone.classId}`;
      } catch {
        clone.classId = `Class: ${clone.classId}`;
      }
    }
  }

  /* =====================================================================
     PARENT SNAPSHOT FIX
     ===================================================================== */
  if (isParent) {
    if (clone.children.length > 0) {
      try {
        const students = await Student.find({ _id: { $in: clone.children } })
          .setOptions({ includeDeleted: true })
          .lean();

        const userIds = students.map((s) => s.userId);

        const users = await User.find({ userId: { $in: userIds } })
          .setOptions({ includeDeleted: true })
          .lean();

        const nameMap = {};
        users.forEach((u) => (nameMap[u.userId] = u.name));

        const resolvedNames = students.map(
          (s) => nameMap[s.userId] || s.admissionNumber || s.userId || "-"
        );

        clone.children = resolvedNames.join(", ");
      } catch {
        clone.children = "None";
      }
    } else {
      clone.children = "None";
    }
  }

  return clone;
};
