import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import {
  createSession,
  listSessions,
  getSession,
  updateSession,
  removeSession,
  markRecords,
} from "./attendance.controller";

const router = Router();

router.post(
  "/attendance/sessions",
  authorize(["TEACHER", "SECRETARY"]),
  createSession,
);
router.get(
  "/attendance/sessions",
  authorize(["TEACHER", "SECRETARY"]),
  listSessions,
);
router.get(
  "/attendance/sessions/:id",
  authorize(["TEACHER", "SECRETARY"]),
  getSession,
);
router.patch(
  "/attendance/sessions/:id",
  authorize(["TEACHER", "SECRETARY"]),
  updateSession,
);
router.delete(
  "/attendance/sessions/:id",
  authorize(["TEACHER", "SECRETARY"]),
  removeSession,
);

router.post(
  "/attendance/sessions/:id/records",
  authorize(["TEACHER", "SECRETARY"]),
  markRecords,
);

export default router;
