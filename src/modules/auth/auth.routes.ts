import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, resetPassword } from "./auth.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/auth/login", loginLimiter, login);

router.patch(
  "/users/:id/reset-password",
  authenticate,
  authorize(["SECRETARY"]),
  resetPassword,
);

export default router;
