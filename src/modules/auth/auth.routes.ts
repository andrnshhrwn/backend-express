import { Router } from "express";
import { authController } from "./auth.controller";
import { authenticate } from "../../middlewares/authenticate";

import { validateLogin } from "./auth.validator";

const router = Router();

router.post("/login", validateLogin, authController.login);

router.get("/me", authenticate, authController.me);

export default router;
