import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import {
  createGradeLevel,
  listGradeLevels,
  getGradeLevel,
  updateGradeLevel,
  deleteGradeLevel,
} from "./grade-levels.controller";

const router = Router();

router.post("/grade-levels", authorize(["SECRETARY"]), createGradeLevel);
router.get("/grade-levels", authorize(["SECRETARY"]), listGradeLevels);
router.get("/grade-levels/:id", authorize(["SECRETARY"]), getGradeLevel);
router.patch("/grade-levels/:id", authorize(["SECRETARY"]), updateGradeLevel);
router.delete("/grade-levels/:id", authorize(["SECRETARY"]), deleteGradeLevel);

export default router;
