import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { userController } from "./user.controller";
import {
  validateCreateTeknisi,
  validateCreateUser,
  validateUpdateUser,
  validateUserId,
} from "./user.validator";

const router = Router();

router.use(authenticate);

// Khusus Admin Cabang
router.get("/teknisi", authorize("admin_cabang"), userController.findTeknisi);

router.post(
  "/teknisi",
  authorize("admin_cabang"),
  validateCreateTeknisi,
  userController.createTeknisi,
);

// Semua route berikutnya khusus Admin Pusat
router.use(authorize("admin_pusat"));

router.get("/", userController.findAll);

router.get("/:id", validateUserId, userController.findById);

router.post("/", validateCreateUser, userController.create);

router.patch("/:id", validateUserId, validateUpdateUser, userController.update);

export default router;
