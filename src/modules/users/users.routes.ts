import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deactivateUser,
} from "./users.controller";

const router = Router();

router.post(
  "/users",
  authenticate,
  authorize(["ADMIN_GLOBAL", "SECRETARY"]),
  createUser,
);

router.get(
  "/users",
  authenticate,
  authorize(["ADMIN_GLOBAL", "SECRETARY"]),
  listUsers,
);

router.get(
  "/users/:id",
  authenticate,
  authorize(["ADMIN_GLOBAL", "SECRETARY"]),
  getUser,
);

router.patch(
  "/users/:id",
  authenticate,
  authorize(["ADMIN_GLOBAL", "SECRETARY"]),
  updateUser,
);

router.patch(
  "/users/:id/deactivate",
  authenticate,
  authorize(["ADMIN_GLOBAL", "SECRETARY"]),
  deactivateUser,
);

export default router;
