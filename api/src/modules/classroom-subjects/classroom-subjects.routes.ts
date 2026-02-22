import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import {
  addSubjectToClassroom,
  listClassroomSubjects,
  removeClassroomSubject,
} from "./classroom-subjects.controller";

const router = Router({ mergeParams: true });

router.post(
  "/classrooms/:classroomId/subjects",
  authorize(["SECRETARY"]),
  addSubjectToClassroom,
);

router.get(
  "/classrooms/:classroomId/subjects",
  authorize(["SECRETARY"]),
  listClassroomSubjects,
);

router.patch(
  "/classrooms/:classroomId/subjects/:id/remove",
  authorize(["SECRETARY"]),
  removeClassroomSubject,
);

export default router;
