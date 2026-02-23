import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  login,
  resetPassword,
  forgotPassword,
  me as getMe,
  changePassword,
} from "./auth.controller";
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

const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    error: "Muitas tentativas de reset. Tente novamente em 1 hora.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/auth/login", loginLimiter, login);

router.post("/auth/forgot-password", resetPasswordLimiter, forgotPassword);

router.get("/auth/me", authenticate, getMe);

router.patch("/auth/change-password", authenticate, changePassword);

export default router;
