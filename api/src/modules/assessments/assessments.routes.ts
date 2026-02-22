import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import { requireClassroomAccess } from "../../middlewares/requireClassroomAccess";
import {
  createAssessment,
  listAssessments,
  getAssessment,
  updateAssessment,
  removeAssessment,
} from "./assessments.controller";

const router = Router();

router.post(
  "/assessments",
  authorize(["TEACHER", "SECRETARY"]),
  requireClassroomAccess,
  createAssessment,
);
router.get(
  "/assessments",
  authorize(["TEACHER", "SECRETARY", "STUDENT", "GUARDIAN"]),
  listAssessments,
);
router.get(
  "/assessments/:id",
  authorize(["TEACHER", "SECRETARY", "STUDENT", "GUARDIAN"]),
  requireClassroomAccess,
  getAssessment,
);
router.patch(
  "/assessments/:id",
  authorize(["TEACHER", "SECRETARY"]),
  requireClassroomAccess,
  updateAssessment,
);
router.delete(
  "/assessments/:id",
  authorize(["TEACHER", "SECRETARY"]),
  requireClassroomAccess,
  removeAssessment,
);

export default router;
