import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import {
  createSubject,
  listSubjects,
  getSubject,
  updateSubject,
  deleteSubject,
} from "./subjects.controller";

const router = Router();

router.post("/subjects", authorize(["SECRETARY"]), createSubject);
router.get("/subjects", authorize(["SECRETARY"]), listSubjects);
router.get("/subjects/:id", authorize(["SECRETARY"]), getSubject);
router.patch("/subjects/:id", authorize(["SECRETARY"]), updateSubject);
router.delete("/subjects/:id", authorize(["SECRETARY"]), deleteSubject);

export default router;
