import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import {
  getTeacherProfile,
  upsertTeacherProfile,
  getGuardianProfile,
  upsertGuardianProfile,
} from "./profiles.controller";

const router = Router();

router.get(
  "/users/:userId/teacher-profile",
  authorize(["SECRETARY"]),
  getTeacherProfile,
);
router.put(
  "/users/:userId/teacher-profile",
  authorize(["SECRETARY"]),
  upsertTeacherProfile,
);

router.get(
  "/users/:userId/guardian-profile",
  authorize(["SECRETARY"]),
  getGuardianProfile,
);
router.put(
  "/users/:userId/guardian-profile",
  authorize(["SECRETARY"]),
  upsertGuardianProfile,
);

export default router;
