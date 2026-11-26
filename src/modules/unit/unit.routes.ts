import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { unitController } from "./unit.controller.js";
import {
  validateCreateUnit,
  validateUpdateUnit,
  validateUnitId,
} from "./unit.validator.js";

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
