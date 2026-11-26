import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { importPelangganController } from "./import-pelanggan.controller.js";
import { uploadPelangganImport } from "./import-pelanggan.upload.js";
import { confirmImportPelangganSchema } from "./import-pelanggan.validator.js";

const router = Router();

router.use(authenticate);
router.use(authorize("admin_pusat"));

router.post(
  "/preview",
  uploadPelangganImport,
  importPelangganController.preview,
);

router.post(
  "/confirm",
  validate(confirmImportPelangganSchema, "body"),
  importPelangganController.confirm,
);

export default router;
