import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import { createOrUpdateGrade, listGrades, getGrade } from "./grades.controller";

const router = Router();

router.post(
  "/grades",
  authorize(["TEACHER", "SECRETARY"]),
  createOrUpdateGrade,
);
router.get("/grades", authorize(["TEACHER", "SECRETARY"]), listGrades);
router.get("/grades/:id", authorize(["TEACHER", "SECRETARY"]), getGrade);

export default router;
