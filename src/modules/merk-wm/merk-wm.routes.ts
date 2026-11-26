import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { merkWmController } from "./merk-wm.controller.js";
import {
  validateCreateMerkWm,
  validateUpdateMerkWm,
  validateMerkWmId,
} from "./merk-wm.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", merkWmController.findAll);
router.get("/:id", validateMerkWmId, merkWmController.findById);

router.post(
  "/",
  authorize("admin_pusat"),
  validateCreateMerkWm,
  merkWmController.create,
);

router.patch(
  "/:id",
  authorize("admin_pusat"),
  validateMerkWmId,
  validateUpdateMerkWm,
  merkWmController.update,
);

router.delete(
  "/:id",
  authorize("admin_pusat"),
  validateMerkWmId,
  merkWmController.delete,
);

export default router;
