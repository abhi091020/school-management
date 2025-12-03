import mongoose from "mongoose";
const { Schema, model } = mongoose;

/* ============================================================================
   SUPPORTED ENTITY TYPES
   Matches: MODEL_MAP + mirror log "all"
============================================================================ */
export const SUPPORTED_TYPES = [
  "user",
  "admin",
  "student",
  "parent",
  "teacher",
  "class",
  "subject",
  "attendance",
  "exam",
  "mark",
  "timetable",
  "fee",
  "notification",
  "feedback",
  "all",
];

/* ============================================================================
   SUPPORTED ACTIONS
   - deleted              → soft-delete (isActive = true)
   - restored             → soft-restore (isActive = false)
   - permanently_deleted  → hard delete (isActive irrelevant)
============================================================================ */
export const SUPPORTED_ACTIONS = ["deleted", "restored", "permanently_deleted"];

/* ============================================================================
   SCHEMA
============================================================================ */
const recycleHistorySchema = new Schema(
  {
    itemId: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: SUPPORTED_TYPES,
      lowercase: true,
      trim: true,
    },

    action: {
      type: String,
      required: true,
      enum: SUPPORTED_ACTIONS,
    },

    /* Soft-delete entries show in Recycle Bin */
    isActive: {
      type: Boolean,
      default: true,
    },

    /* The actual User ID who performed the action */
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* Snapshot of the actor — must ALWAYS be available */
    performedBySnapshot: {
      type: new Schema(
        {
          name: { type: String, default: "Unknown" },
          email: { type: String, default: "-" },
          role: { type: String, default: "-" },
        },
        { _id: false }
      ),
      default: () => ({
        name: "Unknown",
        email: "-",
        role: "-",
      }),
    },

    /* Document state at time of delete */
    snapshot: {
      type: Schema.Types.Mixed,
      default: null,
    },

    /* Only populated when action === "deleted" */
    deletedAt: {
      type: Date,
      default: null,
    },

    /* Always populated for all actions */
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "recycle_history",
    strict: true,
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform(_, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/* ============================================================================
   INDEXES (High-performance for Recycle Bin + History screens)
============================================================================ */

/* Core filtering + sorting */
recycleHistorySchema.index({
  type: 1,
  action: 1,
  isActive: 1,
  timestamp: -1,
});

/* Recycle Bin sorting */
recycleHistorySchema.index({ deletedAt: -1 });

/* Quick lookup for restore operations */
recycleHistorySchema.index({ itemId: 1 });

/* Snapshot searches */
recycleHistorySchema.index({ "snapshot.name": 1 });
recycleHistorySchema.index({ "snapshot.email": 1 });
recycleHistorySchema.index({ "snapshot.userId": 1 });
recycleHistorySchema.index({ "snapshot.admissionNumber": 1 });

/* Actor searches */
recycleHistorySchema.index({ performedBy: 1 });
recycleHistorySchema.index({ "performedBySnapshot.name": 1 });
recycleHistorySchema.index({ "performedBySnapshot.email": 1 });

/* ============================================================================
   VIRTUALS
============================================================================ */
recycleHistorySchema.virtual("entityId").get(function () {
  if (!this.itemId) return null;

  try {
    return new mongoose.Types.ObjectId(this.itemId);
  } catch {
    return null;
  }
});

/* ============================================================================
   EXPORT
============================================================================ */
export default model("RecycleHistory", recycleHistorySchema);
