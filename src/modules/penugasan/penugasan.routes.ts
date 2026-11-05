import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";

import {
  validatePenugasanId,
  validateCreatePenugasan,
  validateUpdatePenugasan,
  validateAssignTeknisi,
} from "./penugasan.validator";

import { penugasanController } from "./penugasan.controller";

const router = Router();

router.use(authenticate);

router.get("/", penugasanController.getAll);

router.get("/:id", validatePenugasanId, penugasanController.getById);

router.post(
  "/",
  authorize("admin_cabang"),
  validateCreatePenugasan,
  penugasanController.create,
);

router.patch(
  "/:id/teknisi",
  authorize("admin_cabang"),
  validatePenugasanId,
  validateAssignTeknisi,
  penugasanController.assignTeknisi,
);

router.patch(
  "/:id/batalkan",
  authorize("admin_cabang"),
  validatePenugasanId,
  penugasanController.cancel,
);

router.patch(
  "/:id",
  authorize("admin_cabang", "teknisi"),
  validatePenugasanId,
  validateUpdatePenugasan,
  penugasanController.update,
);

router.delete(
  "/:id",
  authorize("admin_cabang"),
  validatePenugasanId,
  penugasanController.delete,
);

export default router;
