import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import { requireClassroomAccess } from "../../middlewares/requireClassroomAccess";
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
  requireClassroomAccess,
  createSession,
);
router.get(
  "/attendance/sessions",
  authorize(["TEACHER", "SECRETARY", "STUDENT", "GUARDIAN"]),
  listSessions,
);
router.get(
  "/attendance/sessions/:id",
  authorize(["TEACHER", "SECRETARY", "STUDENT", "GUARDIAN"]),
  requireClassroomAccess,
  getSession,
);
router.patch(
  "/attendance/sessions/:id",
  authorize(["TEACHER", "SECRETARY"]),
  requireClassroomAccess,
  updateSession,
);
router.delete(
  "/attendance/sessions/:id",
  authorize(["TEACHER", "SECRETARY"]),
  requireClassroomAccess,
  removeSession,
);

router.post(
  "/attendance/sessions/:id/records",
  authorize(["TEACHER", "SECRETARY"]),
  requireClassroomAccess,
  markRecords,
);

export default router;
