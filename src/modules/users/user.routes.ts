import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { userController } from "./user.controller";
import {
  validateCreateUser,
  validateUpdateUser,
  validateUserId,
} from "./user.validator";

const router = Router();

router.use(authenticate);

router.use(authorize("admin_pusat"));

router.get("/", userController.findAll);

router.get("/:id", validateUserId, userController.findById);

router.post("/", validateCreateUser, userController.create);

router.patch("/:id", validateUserId, validateUpdateUser, userController.update);

export default router;
