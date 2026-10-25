import { z } from "zod";
import { validate } from "../../middlewares/validate";

const unitIdSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d*$/, "ID unit harus berupa bilangan bulat positif"),
});

const createUnitSchema = z.object({
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
