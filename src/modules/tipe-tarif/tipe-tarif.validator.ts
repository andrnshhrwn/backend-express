import { z } from "zod";
import { validate } from "../../middlewares/validate";

const idSchema = z.object({
  id: z.uuid("ID tarif harus berupa UUID yang valid"),
});

const createSchema = z.object({
  kode_tarif: z
    .string()
    .trim()
    .min(1, "Kode tarif wajib diisi")
    .max(20, "Kode tarif maksimal 20 karakter"),

  nama_tarif: z
    .string()
    .trim()
    .min(1, "Nama tarif wajib diisi")
    .max(100, "Nama tarif maksimal 100 karakter"),
});

const updateSchema = createSchema;

export const validateTipeTarifId = validate(idSchema, "params");

export const validateCreateTipeTarif = validate(createSchema, "body");

export const validateUpdateTipeTarif = validate(updateSchema, "body");
