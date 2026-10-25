import { z } from "zod";
import { validate } from "../../middlewares/validate";

const idSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "ID tarif wajib diisi")
    .max(20, "ID tarif maksimal 20 karakter"),
});

const createSchema = z.object({
  id_tarif: z
    .string()
    .trim()
    .min(1, "ID tarif wajib diisi")
    .max(20, "ID tarif maksimal 20 karakter"),

  nama_tarif: z
    .string()
    .trim()
    .min(1, "Nama tarif wajib diisi")
    .max(100, "Nama tarif maksimal 100 karakter"),
});

const updateSchema = z.object({
  nama_tarif: z
    .string()
    .trim()
    .min(1, "Nama tarif wajib diisi")
    .max(100, "Nama tarif maksimal 100 karakter"),
});

export const validateTipeTarifId = validate(idSchema, "params");

export const validateCreateTipeTarif = validate(createSchema, "body");

export const validateUpdateTipeTarif = validate(updateSchema, "body");
