import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { laporanController } from "./laporan.controller";

const router = Router();

router.use(authenticate, authorize("admin_pusat", "admin_cabang", "pimpinan"));

router.get("/pengiriman-wm", laporanController.pengiriman);
router.get("/penugasan", laporanController.penugasan);
router.get("/penggantian-wm", laporanController.penggantian);

export default router;
