import { AppError } from "../../shared/errors/app-error";
import { validasiRepository } from "./validasi.repository";
import type { TolakBapInput, ValidasiQuery } from "./validasi.validator";

type AdminScope = {
  id_user: string;
  role: "admin_pusat";
  id_unit: string | null;
};

export const validasiService = {
  async getAll(filters: ValidasiQuery, admin: AdminScope) {
    return validasiRepository.findAll(filters, admin);
  },

  async getById(id: string, admin: AdminScope) {
    const data = await validasiRepository.findById(id, admin);

    if (!data) {
      throw new AppError(404, "BAP_NOT_FOUND", "BAP tidak ditemukan.");
    }

    return data;
  },

  async setujui(id: string, _admin: AdminScope) {
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

      case "PENUGASAN_INACTIVE":
        throw new AppError(
          409,
          "PENUGASAN_TIDAK_AKTIF",
          "SPK sudah selesai atau dibatalkan.",
        );

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

  async tolak(id: string, input: TolakBapInput, _admin: AdminScope) {
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

      case "PENUGASAN_INACTIVE":
        throw new AppError(
          409,
          "PENUGASAN_TIDAK_AKTIF",
          "SPK sudah selesai atau dibatalkan.",
        );

      case "REJECTED":
        return result.data;
    }
  },
};
