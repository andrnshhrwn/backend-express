import { z } from "zod";

const kondisiWmLama = z.enum([
  "normal",
  "macet",
  "kaca_pecah",
  "berembun_parah",
  "bodi_korosi",
]);

// String kosong atau hanya spasi dianggap null.
const nullableString = z.preprocess((value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }

  return value;
}, z.string().max(50).nullable().optional());

// String kosong dianggap null.
const nullableNumber = z.preprocess((value) => {
  if (value === "") return null;

  if (typeof value === "string") {
    return Number(value);
  }

  return value;
}, z.number().int().nonnegative().nullable().optional());

// String kosong atau tidak dikirim menggunakan default 0.
const defaultNumber = z.preprocess((value) => {
  if (value === "" || value === undefined) return undefined;

  if (typeof value === "string") {
    return Number(value);
  }

  return value;
}, z.number().int().nonnegative().default(0));

// Field yang tidak dikirim atau kosong menggunakan nilai sebelumnya.
const optionalNumber = z.preprocess((value) => {
  if (value === undefined || value === "") return undefined;

  if (typeof value === "string") {
    return Number(value);
  }

  return value;
}, z.number().int().nonnegative().optional());

// =====================================================
// PARAMS
// =====================================================

export const penugasanIdSchema = z.object({
  id_penugasan: z.uuid("ID penugasan harus berupa UUID yang valid."),
});

export const penggantianWmIdSchema = z.object({
  id: z.uuid("ID BAP harus berupa UUID yang valid."),
});

// =====================================================
// TAHAP 1: DATA WM LAMA
// =====================================================

export const submitDataWmLamaSchema = z
  .object({
    no_seri_wm_lama: nullableString,
    stand_wm_lama: nullableNumber,
    kondisi_fisik_wm_lama: kondisiWmLama,
  })
  .strict();

// =====================================================
// TAHAP 2: PENYELESAIAN PEMASANGAN WM BARU
// =====================================================

export const selesaikanPenggantianWmSchema = z
  .object({
    id_merk: z.uuid("ID merek WM harus berupa UUID yang valid."),
    no_seri_wm_baru: z.string().trim().min(1).max(50),
    stand_awal_wm_baru: defaultNumber,
    tgl_penggantian: z.coerce.date(),
  })
  .strict();

// =====================================================
// PERBAIKAN BAP YANG DITOLAK
// =====================================================

export const perbaikiPenggantianWmSchema = z
  .object({
    no_seri_wm_lama: nullableString,
    stand_wm_lama: nullableNumber,
    kondisi_fisik_wm_lama: kondisiWmLama.optional(),

    no_seri_wm_baru: z.string().trim().min(1).max(50).optional(),
    stand_awal_wm_baru: optionalNumber,
    tgl_penggantian: z.coerce.date().optional(),
  })
  .strict();

// =====================================================
// LIST BAP
// =====================================================

export const listPenggantianWmQuerySchema = z.object({
  id_penugasan: z.uuid("ID penugasan harus berupa UUID yang valid.").optional(),

  status_validasi: z.enum(["menunggu", "disetujui", "ditolak"]).optional(),

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(20),
});

// =====================================================
// TYPES
// =====================================================

export type SubmitDataWmLamaInput = z.infer<typeof submitDataWmLamaSchema>;

export type SelesaikanPenggantianWmInput = z.infer<
  typeof selesaikanPenggantianWmSchema
>;

export type PerbaikiPenggantianWmInput = z.infer<
  typeof perbaikiPenggantianWmSchema
>;

export type ListPenggantianWmQuery = z.infer<
  typeof listPenggantianWmQuerySchema
>;
