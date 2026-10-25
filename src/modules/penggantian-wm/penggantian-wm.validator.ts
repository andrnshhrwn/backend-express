import { z } from "zod";

const kondisiWmLama = z.enum([
  "normal",
  "macet",
  "kaca_pecah",
  "berembun_parah",
  "bodi_korosi",
]);

const nullableString = z.string().trim().max(50).nullable().optional();

export const createPenggantianWmSchema = z
  .object({
    id_penugasan: z.coerce.number().int().positive(),

    no_seri_wm_lama: nullableString,

    stand_wm_lama: z.number().int().nonnegative().nullable().optional(),

    kondisi_fisik_wm_lama: kondisiWmLama,

    path_image_wm_lama: z.string().trim().max(255).nullable().optional(),

    no_seri_wm_baru: z.string().trim().min(1).max(50),

    stand_awal_wm_baru: z.number().int().nonnegative().default(0),

    path_image_wm_baru: z.string().trim().min(1).max(255),

    tgl_penggantian: z.coerce.date(),
  })
  .strict();

export const penggantianWmIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listPenggantianWmQuerySchema = z.object({
  id_penugasan: z.coerce.number().int().positive().optional(),
  status_validasi: z.enum(["menunggu", "disetujui", "ditolak"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreatePenggantianWmInput = z.infer<
  typeof createPenggantianWmSchema
>;

export type ListPenggantianWmQuery = z.infer<
  typeof listPenggantianWmQuerySchema
>;
