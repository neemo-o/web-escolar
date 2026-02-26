import { Router } from "express";
import * as roomsController from "./rooms.controller";
import { authorize } from "../../middlewares/authorize";

const router = Router();

// GET routes accessible by SECRETARY and TEACHER
router.get("/rooms", roomsController.list);
router.get("/rooms/all", roomsController.listAll);
router.get("/rooms/:id", roomsController.getById);

// Write operations only for SECRETARY
router.post("/rooms", authorize(["SECRETARY"]), roomsController.create);
router.patch("/rooms/:id", authorize(["SECRETARY"]), roomsController.update);
router.delete("/rooms/:id", authorize(["SECRETARY"]), roomsController.remove);

export default router;
