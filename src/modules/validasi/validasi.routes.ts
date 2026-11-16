import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";

import { validasiController } from "./validasi.controller";

import {
  tolakBapSchema,
  validasiIdSchema,
  validasiQuerySchema,
} from "./validasi.validator";

const router = Router();

router.use(authenticate);

// Admin Pusat dan Admin Cabang hanya dapat melihat BAP
router.get(
  "/",
  authorize("admin_pusat", "admin_cabang"),
  validate(validasiQuerySchema, "query"),
  validasiController.getAll,
);

router.get(
  "/:id",
  authorize("admin_pusat", "admin_cabang"),
  validate(validasiIdSchema, "params"),
  validasiController.getById,
);

// Aksi validasi hanya boleh dilakukan Admin Pusat
router.patch(
  "/:id/setujui",
  authorize("admin_pusat"),
  validate(validasiIdSchema, "params"),
  validasiController.setujui,
);

router.patch(
  "/:id/tolak",
  authorize("admin_pusat"),
  validate(validasiIdSchema, "params"),
  validate(tolakBapSchema, "body"),
  validasiController.tolak,
);

export default router;
