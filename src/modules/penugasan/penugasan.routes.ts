import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import {
  validatePenugasanId,
  validateCreatePenugasan,
  validateUpdatePenugasan,
} from "./penugasan.validator";
import { penugasanController } from "./penugasan.controller";

const router = Router();

router.use(authenticate);

router.get("/", penugasanController.getAll);
router.get("/:id", validatePenugasanId, penugasanController.getById);

router.post(
  "/",
  authorize("admin_pusat", "admin_cabang"),
  validateCreatePenugasan,
  penugasanController.create,
);

router.patch(
  "/:id",
  authorize("admin_pusat", "admin_cabang"),
  validatePenugasanId,
  validateUpdatePenugasan,
  penugasanController.update,
);

router.delete(
  "/:id",
  authorize("admin_pusat"),
  validatePenugasanId,
  penugasanController.delete,
);

export default router;
