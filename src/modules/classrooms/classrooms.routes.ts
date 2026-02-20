import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import {
  createClassroom,
  listClassrooms,
  getClassroom,
  updateClassroom,
  deleteClassroom,
} from "./classrooms.controller";

const router = Router();

router.post("/classrooms", authorize(["SECRETARY"]), createClassroom);
router.get("/classrooms", authorize(["SECRETARY"]), listClassrooms);
router.get("/classrooms/:id", authorize(["SECRETARY"]), getClassroom);
router.patch("/classrooms/:id", authorize(["SECRETARY"]), updateClassroom);
router.delete("/classrooms/:id", authorize(["SECRETARY"]), deleteClassroom);

export default router;
