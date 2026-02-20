import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import {
  createSchool,
  listSchools,
  getSchool,
  updateSchool,
  activateSchool,
  deactivateSchool,
} from "./schools.controller";

const router = Router();

router.post(
  "/schools",
  authenticate,
  authorize(["ADMIN_GLOBAL"]),
  createSchool,
);

router.get(
  "/schools",
  authenticate,
  authorize(["ADMIN_GLOBAL"]),
  listSchools,
);

router.get(
  "/schools/:id",
  authenticate,
  authorize(["ADMIN_GLOBAL"]),
  getSchool,
);

router.patch(
  "/schools/:id",
  authenticate,
  authorize(["ADMIN_GLOBAL"]),
  updateSchool,
);

router.patch(
  "/schools/:id/activate",
  authenticate,
  authorize(["ADMIN_GLOBAL"]),
  activateSchool,
);

router.patch(
  "/schools/:id/deactivate",
  authenticate,
  authorize(["ADMIN_GLOBAL"]),
  deactivateSchool,
);

export default router;
