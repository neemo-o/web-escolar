import { Router } from "express";
import * as timeBlocksController from "./time-blocks.controller";

const router = Router();

router.get("/time-blocks", timeBlocksController.list);
router.get("/time-blocks/all", timeBlocksController.listAll);
router.get("/time-blocks/:id", timeBlocksController.getById);
router.post("/time-blocks", timeBlocksController.create);
router.patch("/time-blocks/:id", timeBlocksController.update);
router.delete("/time-blocks/:id", timeBlocksController.remove);
router.post("/time-blocks/reorder", timeBlocksController.reorder);

export default router;
