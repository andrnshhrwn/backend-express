import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { tipeTarifController } from "./tipe-tarif.controller";
import {
  validateCreateTipeTarif,
  validateUpdateTipeTarif,
  validateTipeTarifId,
} from "./tipe-tarif.validator";

const router = Router();

router.use(authenticate);

router.get("/", tipeTarifController.findAll);
router.get("/:id", validateTipeTarifId, tipeTarifController.findById);

router.post(
  "/",
  authorize("admin_pusat"),
  validateCreateTipeTarif,
  tipeTarifController.create,
);

router.patch(
  "/:id",
  authorize("admin_pusat"),
  validateTipeTarifId,
  validateUpdateTipeTarif,
  tipeTarifController.update,
);

router.delete(
  "/:id",
  authorize("admin_pusat"),
  validateTipeTarifId,
  tipeTarifController.delete,
);

export default router;
