import { z } from "zod";
import { validate } from "../../middlewares/validate";

const pengirimanDetailSchema = z.object({
  id_merk: z.coerce.number().int().positive(),
  ukuran_dn: z.string().trim().min(1, "Ukuran DN wajib diisi").max(20),
  jumlah: z.coerce.number().int().positive("Jumlah harus lebih dari 0"),
});

const createPengirimanSchema = z.object({
  no_pengiriman: z
    .string()
    .trim()
    .min(1, "Nomor pengiriman wajib diisi")
    .max(50),
  id_unit_tujuan: z.coerce.number().int().positive(),
  tgl_pengiriman: z.coerce.date(),
  catatan: z.string().trim().max(5000).nullable().optional(),
  details: z
    .array(pengirimanDetailSchema)
    .min(1, "Minimal satu detail WM wajib diisi"),
});

const updatePengirimanSchema = z
  .object({
    no_pengiriman: z.string().trim().min(1).max(50).optional(),
    id_unit_tujuan: z.coerce.number().int().positive().optional(),
    tgl_pengiriman: z.coerce.date().optional(),
    catatan: z.string().trim().max(5000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi",
  });

const pengirimanIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const validateCreatePengiriman = validate(
  createPengirimanSchema,
  "body",
);

export const validateUpdatePengiriman = validate(
  updatePengirimanSchema,
  "body",
);

export const validatePengirimanId = validate(pengirimanIdSchema, "params");
