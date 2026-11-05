import { z } from "zod";
import { validate } from "../../middlewares/validate";

const penugasanIdSchema = z.object({
  id: z.uuid("ID penugasan harus berupa UUID yang valid"),
});

const createPenugasanSchema = z.object({
  id_pelanggan: z.uuid("ID pelanggan harus berupa UUID yang valid"),
  id_unit: z.uuid("ID unit harus berupa UUID yang valid"),
  tgl_penugasan: z.coerce.date().optional(),
  alasan: z.string().trim().min(1).max(255),
});

const assignTeknisiSchema = z.object({
  id_teknisi: z.uuid("ID teknisi harus berupa UUID yang valid"),
});

const updatePenugasanSchema = z
  .object({
    tgl_penugasan: z.coerce.date().optional(),
    alasan: z.string().trim().min(1).max(255).optional(),
    status: z.enum(["pending", "proses", "selesai", "dibatalkan"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi",
  });

export const validatePenugasanId = validate(penugasanIdSchema, "params");
export const validateCreatePenugasan = validate(createPenugasanSchema, "body");
export const validateAssignTeknisi = validate(assignTeknisiSchema, "body");
export const validateUpdatePenugasan = validate(updatePenugasanSchema, "body");
