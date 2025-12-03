import express from "express";
const router = express.Router();

import * as parentController from "../../controllers/parent/parentController.js";
import sessionMiddleware from "../../middlewares/sessionMiddleware.js";
import { authorize } from "../../middlewares/authMiddleware.js";

router.use(sessionMiddleware);

router.get("/profile", authorize("parent"), parentController.getParentProfile);

router.patch(
  "/profile",
  authorize("parent"),
  parentController.updateParentProfile
);

export default router;
