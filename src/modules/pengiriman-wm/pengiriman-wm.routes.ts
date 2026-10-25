import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { pengirimanWmController } from "./pengiriman-wm.controller";
import {
  validateCreatePengiriman,
  validateUpdatePengiriman,
  validatePengirimanId,
} from "./pengiriman-wm.validator";

const router = Router();

router.use(authenticate);

router.use(authorize("admin_pusat"));

router.get("/", pengirimanWmController.findAll);

router.get("/:id", validatePengirimanId, pengirimanWmController.findById);

router.post("/", validateCreatePengiriman, pengirimanWmController.create);

router.patch(
  "/:id",
  validatePengirimanId,
  validateUpdatePengiriman,
  pengirimanWmController.update,
);

router.delete("/:id", validatePengirimanId, pengirimanWmController.delete);

export default router;
