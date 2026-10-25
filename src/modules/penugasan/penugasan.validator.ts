import { z } from "zod";
import { validate } from "../../middlewares/validate";

const penugasanIdSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d*$/, "ID penugasan harus berupa bilangan bulat positif"),
});

const createPenugasanSchema = z.object({
  id_pelanggan: z.coerce.number().int().positive(),
  id_unit: z.coerce.number().int().positive(),
  tgl_penugasan: z.coerce.date().optional(),
  alasan: z.string().trim().min(1).max(255),
  id_teknisi: z.coerce.number().int().positive(),
});

const updatePenugasanSchema = z
  .object({
    id_unit: z.coerce.number().int().positive().optional(),
    tgl_penugasan: z.coerce.date().optional(),
    alasan: z.string().trim().min(1).max(255).optional(),
    id_teknisi: z.coerce.number().int().positive().optional(),
    status: z.enum(["pending", "proses", "selesai", "dibatalkan"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi",
  });

export const validatePenugasanId = validate(penugasanIdSchema, "params");
export const validateCreatePenugasan = validate(createPenugasanSchema, "body");
export const validateUpdatePenugasan = validate(updatePenugasanSchema, "body");
