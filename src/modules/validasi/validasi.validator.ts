import { z } from "zod";

export const validasiIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const validasiQuerySchema = z.object({
  status_validasi: z.enum(["menunggu", "disetujui", "ditolak"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const tolakBapSchema = z
  .object({
    catatan_validasi: z
      .string()
      .trim()
      .min(1, "Catatan penolakan wajib diisi")
      .max(5000, "Catatan maksimal 5000 karakter"),
  })
  .strict();

export type ValidasiQuery = z.infer<typeof validasiQuerySchema>;
export type TolakBapInput = z.infer<typeof tolakBapSchema>;
