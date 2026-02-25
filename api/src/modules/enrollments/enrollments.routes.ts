import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import {
  createEnrollment,
  listEnrollments,
  getEnrollment,
  updateEnrollmentStatus,
  listEnrollmentHistory,
  listEnrollmentDocuments,
  createEnrollmentDocument,
  updateEnrollmentDocument,
  deleteEnrollmentDocument,
  pdfEnrollmentDeclaration,
  pdfEnrollmentProof,
  pdfEnrollmentTransfer,
  pdfEnrollmentHistory,
} from "./enrollments.controller";

const router = Router();

router.post("/enrollments", authorize(["SECRETARY"]), createEnrollment);
router.get(
  "/enrollments",
  authorize(["SECRETARY", "STUDENT", "GUARDIAN", "TEACHER"]),
  listEnrollments,
);
router.get(
  "/enrollments/:id",
  authorize(["SECRETARY", "STUDENT", "GUARDIAN", "TEACHER"]),
  getEnrollment,
);
router.patch(
  "/enrollments/:id/status",
  authorize(["SECRETARY"]),
  updateEnrollmentStatus,
);

router.get(
  "/enrollments/:id/history",
  authorize(["SECRETARY", "STUDENT", "GUARDIAN", "TEACHER"]),
  listEnrollmentHistory,
);

router.get(
  "/enrollments/:id/documents",
  authorize(["SECRETARY"]),
  listEnrollmentDocuments,
);
router.post(
  "/enrollments/:id/documents",
  authorize(["SECRETARY"]),
  createEnrollmentDocument,
);
router.patch(
  "/enrollments/:id/documents/:docId",
  authorize(["SECRETARY"]),
  updateEnrollmentDocument,
);
router.delete(
  "/enrollments/:id/documents/:docId",
  authorize(["SECRETARY"]),
  deleteEnrollmentDocument,
);

router.get(
  "/enrollments/:id/pdf/declaration",
  authorize(["SECRETARY"]),
  pdfEnrollmentDeclaration,
);
router.get(
  "/enrollments/:id/pdf/proof",
  authorize(["SECRETARY"]),
  pdfEnrollmentProof,
);
router.get(
  "/enrollments/:id/pdf/transfer",
  authorize(["SECRETARY"]),
  pdfEnrollmentTransfer,
);
router.get(
  "/enrollments/:id/pdf/history",
  authorize(["SECRETARY"]),
  pdfEnrollmentHistory,
);

export default router;
