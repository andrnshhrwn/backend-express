import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";

import {
  uploadFotoWmLama,
  uploadFotoWmBaru,
  uploadFotoPerbaikanBap,
  attachUploadedStorageFiles,
} from "../../middlewares/upload";

import { penggantianWmController } from "./penggantian-wm.controller";

import {
  penugasanIdSchema,
  penggantianWmIdSchema,
  submitDataWmLamaSchema,
  selesaikanPenggantianWmSchema,
  perbaikiPenggantianWmSchema,
  listPenggantianWmQuerySchema,
} from "./penggantian-wm.validator";

const router = Router();

router.use(authenticate);

// ===================================================
// RINGKASAN STOK WM
// ===================================================

router.get(
  "/stok",
  authorize("admin_pusat", "admin_cabang"),
  penggantianWmController.getStok,
);

// ===================================================
// DAFTAR DAN DETAIL BAP
// ===================================================

router.get(
  "/",
  authorize("admin_pusat", "admin_cabang", "teknisi"),
  validate(listPenggantianWmQuerySchema, "query"),
  penggantianWmController.getAll,
);

router.get(
  "/:id",
  authorize("admin_pusat", "admin_cabang", "teknisi"),
  validate(penggantianWmIdSchema, "params"),
  penggantianWmController.getById,
);

// ===================================================
// TAHAP 1: DATA WM LAMA
// ===================================================

router.post(
  "/:id_penugasan/data-wm-lama",
  authorize("teknisi"),
  uploadFotoWmLama,
  validate(penugasanIdSchema, "params"),
  validate(submitDataWmLamaSchema),
  attachUploadedStorageFiles,
  penggantianWmController.submitDataWmLama,
);

// ===================================================
// TAHAP 2: SELESAIKAN PEMASANGAN WM BARU
// ===================================================

router.post(
  "/:id/selesaikan",
  authorize("teknisi"),
  uploadFotoWmBaru,
  validate(penggantianWmIdSchema, "params"),
  validate(selesaikanPenggantianWmSchema),
  attachUploadedStorageFiles,
  penggantianWmController.selesaikan,
);

// ===================================================
// PERBAIKAN DAN PENGAJUAN ULANG BAP
// ===================================================

router.patch(
  "/:id/perbaiki",
  authorize("teknisi"),
  uploadFotoPerbaikanBap,
  validate(penggantianWmIdSchema, "params"),
  validate(perbaikiPenggantianWmSchema),
  attachUploadedStorageFiles,
  penggantianWmController.perbaiki,
);

export default router;
