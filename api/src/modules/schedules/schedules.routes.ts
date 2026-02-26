import { Router } from "express";
import * as schedulesController from "./schedules.controller";
import { authorize } from "../../middlewares/authorize";

const router = Router();

// GET routes accessible by SECRETARY and TEACHER
router.get("/schedules", schedulesController.list);
router.get("/schedules/by-block", schedulesController.findByBlock);

// Write operations only for SECRETARY
router.post("/schedules", authorize(["SECRETARY"]), schedulesController.create);
router.patch(
  "/schedules/:id",
  authorize(["SECRETARY"]),
  schedulesController.update,
);
router.delete(
  "/schedules/:id",
  authorize(["SECRETARY"]),
  schedulesController.remove,
);

export default router;
