import { z } from "zod";

export const importPelangganRowSchema = z
  .object({
    id_pelanggan_pdam: z
      .string()
      .trim()
      .min(1, "ID Pelanggan PDAM wajib diisi.")
      .max(50, "ID Pelanggan PDAM maksimal 50 karakter."),

    kode_unit: z
      .string()
      .trim()
      .min(1, "Kode unit wajib diisi.")
      .max(20, "Kode unit maksimal 20 karakter."),

    nama: z
      .string()
      .trim()
      .min(1, "Nama pelanggan wajib diisi.")
      .max(100, "Nama pelanggan maksimal 100 karakter."),

    alamat: z
      .string()
      .trim()
      .min(1, "Alamat wajib diisi.")
      .max(255, "Alamat maksimal 255 karakter."),

    kode_tarif: z
      .string()
      .trim()
      .min(1, "Kode tarif wajib diisi.")
      .max(20, "Kode tarif maksimal 20 karakter."),

    wm_no_seri_aktif: z
      .string()
      .trim()
      .max(50, "Nomor seri WM maksimal 50 karakter.")
      .optional()
      .default(""),
  })
  .strict();

export const confirmImportPelangganSchema = z
  .object({
    rows: z
      .array(importPelangganRowSchema)
      .min(1, "Minimal harus ada satu baris data.")
      .max(5000, "Maksimal 5.000 baris data per impor."),

    confirm: z.literal(true),
  })
  .strict();

export type ImportPelangganRow = z.infer<typeof importPelangganRowSchema>;

export type ConfirmImportPelangganInput = z.infer<
  typeof confirmImportPelangganSchema
>;
