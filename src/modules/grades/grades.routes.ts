import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import { requireClassroomAccess } from "../../middlewares/requireClassroomAccess";
import { createOrUpdateGrade, listGrades, getGrade } from "./grades.controller";

const router = Router();

router.post(
  "/assessments/:assessmentId/grades",
  authorize(["TEACHER", "SECRETARY"]),
  requireClassroomAccess,
  createOrUpdateGrade,
);

router.patch(
  "/assessments/:assessmentId/grades/:id",
  authorize(["TEACHER", "SECRETARY"]),
  requireClassroomAccess,
  createOrUpdateGrade,
);

router.get(
  "/assessments/:assessmentId/grades",
  authorize(["TEACHER", "SECRETARY", "STUDENT", "GUARDIAN"]),
  requireClassroomAccess,
  listGrades,
);

router.get(
  "/enrollments/:enrollmentId/grades",
  authorize(["TEACHER", "SECRETARY", "STUDENT", "GUARDIAN"]),
  listGrades,
);

router.get("/grades/:id", authorize(["TEACHER", "SECRETARY"]), getGrade);

export default router;
