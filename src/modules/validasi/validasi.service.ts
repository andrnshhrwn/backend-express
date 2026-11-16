import { AppError } from "../../shared/errors/app-error";
import { validasiRepository } from "./validasi.repository";

import type { TolakBapInput, ValidasiQuery } from "./validasi.validator";

type ReadScope =
  | {
      id_user: string;
      role: "admin_pusat";
      id_unit: string | null;
    }
  | {
      id_user: string;
      role: "admin_cabang";
      id_unit: string;
    };

type AdminScope = {
  id_user: string;
  role: "admin_pusat";
  id_unit: string | null;
};

function handleValidationError(kind: string): never {
  switch (kind) {
    case "PENUGASAN_BELUM_SELESAI":
      throw new AppError(
        409,
        "PENUGASAN_BELUM_SELESAI",
        "SPK harus berstatus selesai sebelum BAP dapat divalidasi.",
      );

    case "BAP_DATA_BELUM_LENGKAP":
      throw new AppError(
        409,
        "BAP_DATA_BELUM_LENGKAP",
        "BAP belum lengkap. Pastikan kondisi fisik WM lama, nomor seri WM baru, stand awal WM baru, kedua foto, dan tanggal penggantian tersedia.",
      );

    default:
      throw new AppError(
        500,
        "INTERNAL_SERVER_ERROR",
        "Terjadi kesalahan saat memproses validasi BAP.",
      );
  }
}

export const validasiService = {
  async getAll(filters: ValidasiQuery, actor: ReadScope) {
    return validasiRepository.findAll(filters, actor);
  },

  async getById(id: string, actor: ReadScope) {
    const data = await validasiRepository.findById(id, actor);

    if (!data) {
      throw new AppError(404, "BAP_NOT_FOUND", "BAP tidak ditemukan.");
    }

    return data;
  },

  async setujui(id: string, admin: AdminScope) {
    if (admin.role !== "admin_pusat") {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Hanya Admin Pusat yang dapat menyetujui BAP.",
      );
    }

    const result = await validasiRepository.setujui(id);

    switch (result.kind) {
      case "NOT_FOUND":
        throw new AppError(404, "BAP_NOT_FOUND", "BAP tidak ditemukan.");

      case "ALREADY_PROCESSED":
        throw new AppError(
          409,
          "BAP_SUDAH_DIPROSES",
          "BAP sudah divalidasi sebelumnya.",
        );

      case "PENUGASAN_BELUM_SELESAI":
      case "BAP_DATA_BELUM_LENGKAP":
        return handleValidationError(result.kind);

      case "OTHER_BAP_APPROVED":
        throw new AppError(
          409,
          "BAP_LAIN_SUDAH_DISETUJUI",
          "SPK ini sudah memiliki BAP lain yang disetujui.",
        );

      case "APPROVED":
        return result.data;
    }
  },

  async tolak(id: string, input: TolakBapInput, admin: AdminScope) {
    if (admin.role !== "admin_pusat") {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Hanya Admin Pusat yang dapat menolak BAP.",
      );
    }

    const result = await validasiRepository.tolak(id, input);

    switch (result.kind) {
      case "NOT_FOUND":
        throw new AppError(404, "BAP_NOT_FOUND", "BAP tidak ditemukan.");

      case "ALREADY_PROCESSED":
        throw new AppError(
          409,
          "BAP_SUDAH_DIPROSES",
          "BAP sudah divalidasi sebelumnya.",
        );

      case "PENUGASAN_BELUM_SELESAI":
      case "BAP_DATA_BELUM_LENGKAP":
        return handleValidationError(result.kind);

      case "REJECTED":
        return result.data;
    }
  },
};
