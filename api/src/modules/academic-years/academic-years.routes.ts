import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import {
  createAcademicYear,
  listAcademicYears,
  getAcademicYear,
  updateAcademicYear,
  activateAcademicYear,
  updateAcademicYearStatus,
} from "./academic-years.controller";

const router = Router();

router.post("/academic-years", authorize(["SECRETARY"]), createAcademicYear);
router.get("/academic-years", authorize(["SECRETARY"]), listAcademicYears);
router.get("/academic-years/:id", authorize(["SECRETARY"]), getAcademicYear);
router.patch("/academic-years/:id", authorize(["SECRETARY"]), updateAcademicYear);
router.patch("/academic-years/:id/activate", authorize(["SECRETARY"]), activateAcademicYear);
router.patch("/academic-years/:id/status", authorize(["SECRETARY"]), updateAcademicYearStatus);

export default router;
