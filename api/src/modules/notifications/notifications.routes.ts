import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  createNotification,
} from "./notifications.controller";

const router = Router();

router.get(
  "/notifications",
  authorize(["SECRETARY", "TEACHER", "STUDENT", "GUARDIAN", "ADMIN_GLOBAL"]),
  listNotifications,
);
router.get(
  "/notifications/unread-count",
  authorize(["SECRETARY", "TEACHER", "STUDENT", "GUARDIAN", "ADMIN_GLOBAL"]),
  getUnreadCount,
);
router.patch(
  "/notifications/:id/read",
  authorize(["SECRETARY", "TEACHER", "STUDENT", "GUARDIAN", "ADMIN_GLOBAL"]),
  markRead,
);
router.patch(
  "/notifications/read-all",
  authorize(["SECRETARY", "TEACHER", "STUDENT", "GUARDIAN", "ADMIN_GLOBAL"]),
  markAllRead,
);
router.post(
  "/notifications",
  authorize(["SECRETARY", "ADMIN_GLOBAL"]),
  createNotification,
);

export default router;
