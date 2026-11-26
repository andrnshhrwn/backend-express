import { z } from "zod";
import { validate } from "../../middlewares/validate.js";

const unitIdSchema = z.object({
  id: z.uuid("ID unit harus berupa UUID yang valid"),
});

const createUnitSchema = z.object({
  kode_unit: z
    .string()
    .trim()
    .min(1, "Kode unit wajib diisi")
    .max(20, "Kode unit maksimal 20 karakter"),

  nama_unit: z
    .string()
    .trim()
    .min(1, "Nama unit wajib diisi")
    .max(100, "Nama unit maksimal 100 karakter"),
});

const updateUnitSchema = createUnitSchema;

export const validateUnitId = validate(unitIdSchema, "params");

export const validateCreateUnit = validate(createUnitSchema, "body");

export const validateUpdateUnit = validate(updateUnitSchema, "body");
