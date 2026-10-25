import { z } from "zod";
import { validate } from "../../middlewares/validate";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const validateLogin = validate(loginSchema, "body");
