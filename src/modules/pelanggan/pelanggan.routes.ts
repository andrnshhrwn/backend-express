import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { pelangganController } from "./pelanggan.controller";
import {
  validateCreatePelanggan,
  validatePelangganId,
  validateUpdatePelanggan,
} from "./pelanggan.validator";

const router = Router();

router.use(authenticate);

router.get("/", pelangganController.findAll);

router.get("/:id", validatePelangganId, pelangganController.findById);

router.post(
  "/",
  authorize("admin_pusat"),
  validateCreatePelanggan,
  pelangganController.create,
);

router.patch(
  "/:id",
  authorize("admin_pusat"),
  validatePelangganId,
  validateUpdatePelanggan,
  pelangganController.update,
);

router.delete(
  "/:id",
  authorize("admin_pusat"),
  validatePelangganId,
  pelangganController.delete,
);

export default router;
