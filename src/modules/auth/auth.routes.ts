import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { validateLogin } from "./auth.validator.js";

const router = Router();

router.post("/login", validateLogin, authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);

export default router;