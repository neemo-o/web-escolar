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
router.get("/enrollments", authorize(["SECRETARY"]), listEnrollments);
router.get("/enrollments/:id", authorize(["SECRETARY"]), getEnrollment);
router.patch(
  "/enrollments/:id/status",
  authorize(["SECRETARY"]),
  updateEnrollmentStatus,
);

export default router;
