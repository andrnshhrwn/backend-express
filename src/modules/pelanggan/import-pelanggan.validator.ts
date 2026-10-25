import { z } from "zod";

export const importPelangganRowSchema = z
  .object({
    id_pelanggan_pdam: z.string().trim().min(1).max(50),
    id_unit: z.coerce.number().int().positive(),
    nama: z.string().trim().min(1).max(100),
    alamat: z.string().trim().min(1).max(255),
    id_tarif: z.string().trim().min(1).max(20),
    wm_no_seri_aktif: z.string().trim().max(50).optional().default(""),
  })
  .strict();

export const confirmImportPelangganSchema = z
  .object({
    rows: z.array(importPelangganRowSchema).min(1).max(5000),
    confirm: z.literal(true),
  })
  .strict();

export type ImportPelangganRow = z.infer<typeof importPelangganRowSchema>;

export type ConfirmImportPelangganInput = z.infer<
  typeof confirmImportPelangganSchema
>;
