import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { unitController } from "./unit.controller";
import {
  validateCreateUnit,
  validateUpdateUnit,
  validateUnitId,
} from "./unit.validator";

const router = Router();

router.use(authenticate);

router.get("/", unitController.findAll);

router.get("/:id", validateUnitId, unitController.findById);

router.post(
  "/",
  authorize("admin_pusat"),
  validateCreateUnit,
  unitController.create,
);

router.patch(
  "/:id",
  authorize("admin_pusat"),
  validateUnitId,
  validateUpdateUnit,
  unitController.update,
);

router.delete(
  "/:id",
  authorize("admin_pusat"),
  validateUnitId,
  unitController.delete,
);

export default router;
