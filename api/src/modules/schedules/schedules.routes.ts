import { Router } from "express";
import * as schedulesController from "./schedules.controller";

const router = Router();

router.get("/schedules", schedulesController.list);
router.get("/schedules/by-block", schedulesController.findByBlock);
router.post("/schedules", schedulesController.create);
router.patch("/schedules/:id", schedulesController.update);
router.delete("/schedules/:id", schedulesController.remove);

export default router;
