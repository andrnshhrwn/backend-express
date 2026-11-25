import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { laporanController } from "./laporan.controller";

const router = Router();

router.use(authenticate, authorize("admin_pusat", "admin_cabang", "pimpinan"));

// Export Excel
router.get("/pengiriman-wm/export", laporanController.exportPengiriman);
router.get("/penugasan/export", laporanController.exportPenugasan);
router.get("/penggantian-wm/export", laporanController.exportPenggantian);

// Laporan JSON
router.get("/pengiriman-wm", laporanController.pengiriman);
router.get("/penugasan", laporanController.penugasan);
router.get("/penggantian-wm", laporanController.penggantian);

export default router;
