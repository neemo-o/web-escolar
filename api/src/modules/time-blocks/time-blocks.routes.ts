import { Router } from "express";
import * as timeBlocksController from "./time-blocks.controller";
import { authorize } from "../../middlewares/authorize";

const router = Router();

// GET routes accessible by SECRETARY and TEACHER
router.get("/time-blocks", timeBlocksController.list);
router.get("/time-blocks/all", timeBlocksController.listAll);
router.get("/time-blocks/:id", timeBlocksController.getById);

// Write operations only for SECRETARY
router.post(
  "/time-blocks",
  authorize(["SECRETARY"]),
  timeBlocksController.create,
);
router.patch(
  "/time-blocks/:id",
  authorize(["SECRETARY"]),
  timeBlocksController.update,
);
router.delete(
  "/time-blocks/:id",
  authorize(["SECRETARY"]),
  timeBlocksController.remove,
);
router.post(
  "/time-blocks/reorder",
  authorize(["SECRETARY"]),
  timeBlocksController.reorder,
);

export default router;
