import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import {
  addTeacherToClassroom,
  listClassroomTeachers,
  removeClassroomTeacher,
} from "./classroom-teachers.controller";

const router = Router({ mergeParams: true });

router.post(
  "/classrooms/:classroomId/teachers",
  authorize(["SECRETARY"]),
  addTeacherToClassroom,
);

router.get(
  "/classrooms/:classroomId/teachers",
  authorize(["SECRETARY"]),
  listClassroomTeachers,
);

router.patch(
  "/classrooms/:classroomId/teachers/:id/remove",
  authorize(["SECRETARY"]),
  removeClassroomTeacher,
);

export default router;
