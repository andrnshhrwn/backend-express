import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { pengirimanWmController } from "./pengiriman-wm.controller";
import {
  validateCreatePengiriman,
  validateUpdatePengiriman,
  validatePengirimanId,
} from "./pengiriman-wm.validator";

const router = Router();

router.use(authenticate);

// Admin Pusat dan Admin Cabang dapat melihat data.
// Pembatasan data cabang dilakukan di service dan repository.
router.get(
  "/",
  authorize("admin_pusat", "admin_cabang"),
  pengirimanWmController.findAll,
);

router.get(
  "/:id",
  authorize("admin_pusat", "admin_cabang"),
  validatePengirimanId,
  pengirimanWmController.findById,
);

// Hanya Admin Cabang yang dapat mengelola pengiriman.
router.post(
  "/",
  authorize("admin_cabang"),
  validateCreatePengiriman,
  pengirimanWmController.create,
);

router.patch(
  "/:id",
  authorize("admin_cabang"),
  validatePengirimanId,
  validateUpdatePengiriman,
  pengirimanWmController.update,
);

router.delete(
  "/:id",
  authorize("admin_cabang"),
  validatePengirimanId,
  pengirimanWmController.delete,
);

export default router;
