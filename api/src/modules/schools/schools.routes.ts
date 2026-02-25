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
  getMySchool,
  updateMySchoolConfig,
} from "./schools.controller";

const router = Router();

// Public schools listing for login dropdown
import { listPublicSchools } from "./schools.controller";
router.get("/public/schools", listPublicSchools);

// Get the authenticated user's school
router.get("/schools/me", authenticate, getMySchool);
router.patch(
  "/schools/me/config",
  authenticate,
  authorize(["SECRETARY"]),
  updateMySchoolConfig,
);

router.post(
  "/schools",
  authenticate,
  authorize(["ADMIN_GLOBAL"]),
  createSchool,
);

router.get("/schools", authenticate, authorize(["ADMIN_GLOBAL"]), listSchools);

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
