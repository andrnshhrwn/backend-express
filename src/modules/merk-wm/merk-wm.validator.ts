import { z } from "zod";
import { validate } from "../../middlewares/validate";

const idSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d*$/, "ID merek harus berupa bilangan bulat positif"),
});

const merkWmSchema = z.object({
  merk_wm: z
    .string()
    .trim()
    .min(1, "Nama merek wajib diisi")
    .max(50, "Nama merek maksimal 50 karakter"),
  wm_digit: z
    .number()
    .int()
    .positive("Jumlah digit harus berupa bilangan bulat positif"),
});

export const validateMerkWmId = validate(idSchema, "params");

export const validateCreateMerkWm = validate(merkWmSchema, "body");

export const validateUpdateMerkWm = validate(merkWmSchema, "body");
