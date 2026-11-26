import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { dashboardController } from "./dashboard.controller.js";

const router = Router();

router.use(authenticate);

router.get("/summary", dashboardController.getSummary);
router.get("/unit-progress", dashboardController.getUnitProgress);

export default router;
