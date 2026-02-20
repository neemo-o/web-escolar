import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { resetPassword } from "../auth/auth.controller";
import {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deactivateUser,
} from "./users.controller";

const router = Router();

router.post("/users", authorize(["ADMIN_GLOBAL", "SECRETARY"]), createUser);

router.get("/users", authorize(["ADMIN_GLOBAL", "SECRETARY"]), listUsers);

router.get("/users/:id", authorize(["ADMIN_GLOBAL", "SECRETARY"]), getUser);

router.patch(
  "/users/:id",
  authorize(["ADMIN_GLOBAL", "SECRETARY"]),
  updateUser,
);

router.patch(
  "/users/:id/deactivate",
  authorize(["ADMIN_GLOBAL", "SECRETARY"]),
  deactivateUser,
);

router.patch(
  "/users/:id/reset-password",
  authenticate,
  authorize(["SECRETARY"]),
  resetPassword,
);

export default router;
