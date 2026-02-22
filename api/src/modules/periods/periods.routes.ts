import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import {
  createPeriod,
  listPeriods,
  getPeriod,
  updatePeriod,
  updatePeriodStatus,
} from "./periods.controller";

const router = Router({ mergeParams: true });

router.post("/academic-years/:yearId/periods", authorize(["SECRETARY"]), createPeriod);
router.get("/academic-years/:yearId/periods", authorize(["SECRETARY"]), listPeriods);
router.get("/academic-years/:yearId/periods/:id", authorize(["SECRETARY"]), getPeriod);
router.patch("/academic-years/:yearId/periods/:id", authorize(["SECRETARY"]), updatePeriod);
router.patch("/academic-years/:yearId/periods/:id/status", authorize(["SECRETARY"]), updatePeriodStatus);

export default router;
