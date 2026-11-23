import { z } from "zod";

const base = z.object({
  dari: z.iso.date().optional(),
  sampai: z.iso.date().optional(),
  id_unit: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const periodeValid = (v: { dari?: string; sampai?: string }) =>
  !v.dari || !v.sampai || v.dari <= v.sampai;

const periodeMessage = {
  message: "Tanggal 'dari' tidak boleh melebihi 'sampai'",
  path: ["dari"],
};

export const pengirimanQuerySchema = base.refine(periodeValid, periodeMessage);

export const penugasanQuerySchema = base
  .extend({
    status: z.enum(["pending", "proses", "selesai", "dibatalkan"]).optional(),
    id_teknisi: z.uuid().optional(),
  })
  .refine(periodeValid, periodeMessage);

export const penggantianQuerySchema = base
  .extend({
    status_validasi: z.enum(["menunggu", "disetujui", "ditolak"]).optional(),
    tahap_penggantian: z.enum(["data_wm_lama", "menunggu_validasi"]).optional(),
  })
  .refine(periodeValid, periodeMessage);
