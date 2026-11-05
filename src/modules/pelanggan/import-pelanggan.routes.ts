import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import { importPelangganController } from "./import-pelanggan.controller";
import { uploadPelangganImport } from "./import-pelanggan.upload";
import { confirmImportPelangganSchema } from "./import-pelanggan.validator";

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
