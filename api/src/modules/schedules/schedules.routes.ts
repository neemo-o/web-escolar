import { Router } from "express";
import schedulesController from "./schedules.controller";

const router = Router();

router.get("/schedules", schedulesController.list);
router.post("/schedules", schedulesController.create);
router.patch("/schedules/:id", schedulesController.update);
router.delete("/schedules/:id", schedulesController.delete);

export default router;
