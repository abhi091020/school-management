// backend/routes/admin/recycleBinRoutes.js

import express from "express";
import sessionMiddleware from "../../middlewares/sessionMiddleware.js";
import { authorize as requireRoles } from "../../middlewares/authMiddleware.js";

import {
  listDeletedItems,
  restoreItems,
  hardDeleteItems,
} from "../../controllers/admin/recycleBinController.js";

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

/* Routes */
router.get("/", adminOnly, listDeletedItems);
router.post("/restore", adminOnly, restoreItems);
router.delete("/hard-delete", adminOnly, hardDeleteItems);

export default router;
