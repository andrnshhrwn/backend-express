import { z } from "zod";
import { validate } from "../../middlewares/validate.js";

const idSchema = z.object({
  id: z.uuid("ID merek harus berupa UUID yang valid"),
});

const merkWmSchema = z.object({
  kode_wm: z
    .string()
    .trim()
    .min(1, "Kode WM wajib diisi")
    .max(20, "Kode WM maksimal 20 karakter"),

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
