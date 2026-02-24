import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import {
  createStudent,
  listStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  listStudentGuardians,
  linkGuardian,
  unlinkGuardian,
} from "./students.controller";

const router = Router();

router.post("/students", authorize(["SECRETARY"]), createStudent);
router.get("/students", authorize(["SECRETARY"]), listStudents);
router.get("/students/:id", authorize(["SECRETARY"]), getStudent);
router.patch("/students/:id", authorize(["SECRETARY"]), updateStudent);
router.delete("/students/:id", authorize(["SECRETARY"]), deleteStudent);

// FIX #2 + #15: guardian link management
router.get("/students/:id/guardians", authorize(["SECRETARY"]), listStudentGuardians);
router.post("/students/:id/guardians", authorize(["SECRETARY"]), linkGuardian);
router.delete("/students/:id/guardians/:guardianId", authorize(["SECRETARY"]), unlinkGuardian);

export default router;
