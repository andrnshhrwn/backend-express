import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import { penggantianWmController } from "./penggantian-wm.controller";
import {
  createPenggantianWmSchema,
  listPenggantianWmQuerySchema,
  penggantianWmIdSchema,
} from "./penggantian-wm.validator";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize("admin_pusat", "admin_cabang", "teknisi"),
  validate(listPenggantianWmQuerySchema, "query"),
  penggantianWmController.getAll,
);

router.get(
  "/:id",
  authorize("admin_pusat", "admin_cabang", "teknisi"),
  validate(penggantianWmIdSchema, "params"),
  penggantianWmController.getById,
);

router.post(
  "/",
  authorize("teknisi"),
  validate(createPenggantianWmSchema),
  penggantianWmController.create,
);

export default router;
