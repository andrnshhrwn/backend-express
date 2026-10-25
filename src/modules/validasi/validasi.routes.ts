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
router.use(authorize("admin_pusat", "admin_cabang"));

router.get(
  "/",
  validate(validasiQuerySchema, "query"),
  validasiController.getAll,
);

router.get(
  "/:id",
  validate(validasiIdSchema, "params"),
  validasiController.getById,
);

router.patch(
  "/:id/setujui",
  validate(validasiIdSchema, "params"),
  validasiController.setujui,
);

router.patch(
  "/:id/tolak",
  validate(validasiIdSchema, "params"),
  validate(tolakBapSchema, "body"),
  validasiController.tolak,
);

export default router;
