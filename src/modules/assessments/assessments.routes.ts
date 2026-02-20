import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
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
  createAssessment,
);
router.get(
  "/assessments",
  authorize(["TEACHER", "SECRETARY"]),
  listAssessments,
);
router.get(
  "/assessments/:id",
  authorize(["TEACHER", "SECRETARY"]),
  getAssessment,
);
router.patch(
  "/assessments/:id",
  authorize(["TEACHER", "SECRETARY"]),
  updateAssessment,
);
router.delete(
  "/assessments/:id",
  authorize(["TEACHER", "SECRETARY"]),
  removeAssessment,
);

export default router;
