import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import {
  createStudent,
  listStudents,
  getStudent,
  updateStudent,
  deleteStudent,
} from "./students.controller";

const router = Router();

router.post("/students", authorize(["SECRETARY"]), createStudent);
router.get("/students", authorize(["SECRETARY"]), listStudents);
router.get("/students/:id", authorize(["SECRETARY"]), getStudent);
router.patch("/students/:id", authorize(["SECRETARY"]), updateStudent);
router.delete("/students/:id", authorize(["SECRETARY"]), deleteStudent);

export default router;
