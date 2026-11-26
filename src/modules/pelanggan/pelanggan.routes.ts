import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { pelangganController } from "./pelanggan.controller.js";
import {
  validateCreatePelanggan,
  validatePelangganId,
  validateUpdatePelanggan,
} from "./pelanggan.validator.js";

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
