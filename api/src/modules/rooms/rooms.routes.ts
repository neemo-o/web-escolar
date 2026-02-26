import { Router } from "express";
import * as roomsController from "./rooms.controller";

const router = Router();

router.get("/rooms", roomsController.list);
router.get("/rooms/all", roomsController.listAll);
router.get("/rooms/:id", roomsController.getById);
router.post("/rooms", roomsController.create);
router.patch("/rooms/:id", roomsController.update);
router.delete("/rooms/:id", roomsController.remove);

export default router;
