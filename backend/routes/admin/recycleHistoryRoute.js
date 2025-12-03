// backend/routes/admin/recycleHistoryRoute.js

import express from "express";
import sessionMiddleware from "../../middlewares/sessionMiddleware.js";
import { authorize as requireRoles } from "../../middlewares/authMiddleware.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { getRecycleHistory } from "../../controllers/admin/recycleHistoryController.js";

const router = express.Router();

/* Disable caching */
router.use((req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Surrogate-Control": "no-store",
  });
  next();
});

/* Auth */
router.use(sessionMiddleware);
const adminOnly = requireRoles("admin", "super_admin");

/* History Logs */
router.get("/", adminOnly, asyncHandler(getRecycleHistory));

export default router;
