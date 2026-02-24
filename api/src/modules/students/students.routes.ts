import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import {
  createStudent,
  listStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  getStudentHealth,
  upsertStudentHealth,
  listStudentDocuments,
  createStudentDocument,
  updateStudentDocument,
  deleteStudentDocument,
  getStudentHistory,
  listStudentGuardians,
  linkGuardian,
  updateGuardianLink,
  unlinkGuardian,
} from "./students.controller";

const router = Router();

router.post("/students", authorize(["SECRETARY"]), createStudent);
router.get("/students", authorize(["SECRETARY", "TEACHER"]), listStudents);
router.get("/students/:id", authorize(["SECRETARY", "TEACHER"]), getStudent);
router.patch("/students/:id", authorize(["SECRETARY"]), updateStudent);
router.delete("/students/:id", authorize(["SECRETARY"]), deleteStudent);

router.get("/students/:id/health", authorize(["SECRETARY"]), getStudentHealth);
router.put(
  "/students/:id/health",
  authorize(["SECRETARY"]),
  upsertStudentHealth,
);

router.get(
  "/students/:id/documents",
  authorize(["SECRETARY"]),
  listStudentDocuments,
);
router.post(
  "/students/:id/documents",
  authorize(["SECRETARY"]),
  createStudentDocument,
);
router.patch(
  "/students/:id/documents/:docId",
  authorize(["SECRETARY"]),
  updateStudentDocument,
);
router.delete(
  "/students/:id/documents/:docId",
  authorize(["SECRETARY"]),
  deleteStudentDocument,
);

router.get(
  "/students/:id/history",
  authorize(["SECRETARY"]),
  getStudentHistory,
);

router.get(
  "/students/:id/guardians",
  authorize(["SECRETARY"]),
  listStudentGuardians,
);
router.post("/students/:id/guardians", authorize(["SECRETARY"]), linkGuardian);
router.patch(
  "/students/:id/guardians/:guardianId",
  authorize(["SECRETARY"]),
  updateGuardianLink,
);
router.delete(
  "/students/:id/guardians/:guardianId",
  authorize(["SECRETARY"]),
  unlinkGuardian,
);

export default router;
