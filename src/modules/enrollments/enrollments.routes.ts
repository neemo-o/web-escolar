import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import {
  createEnrollment,
  listEnrollments,
  getEnrollment,
  updateEnrollmentStatus,
} from "./enrollments.controller";

const router = Router();

router.post("/enrollments", authorize(["SECRETARY"]), createEnrollment);
router.get(
  "/enrollments",
  authorize(["SECRETARY", "STUDENT", "GUARDIAN"]),
  listEnrollments,
);
router.get(
  "/enrollments/:id",
  authorize(["SECRETARY", "STUDENT", "GUARDIAN"]),
  getEnrollment,
);
router.patch(
  "/enrollments/:id/status",
  authorize(["SECRETARY"]),
  updateEnrollmentStatus,
);

export default router;
