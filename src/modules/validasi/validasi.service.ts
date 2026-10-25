import { AppError } from "../../shared/errors/app-error";
import { validasiRepository } from "./validasi.repository";
import type { TolakBapInput, ValidasiQuery } from "./validasi.validator";

type AdminScope = {
  id_user: number;
  role: "admin_pusat" | "admin_cabang";
  id_unit: number | null;
};

export const validasiService = {
  async getAll(filters: ValidasiQuery, admin: AdminScope) {
    return validasiRepository.findAll(filters, admin);
  },

  async getById(id: number, admin: AdminScope) {
    const data = await validasiRepository.findById(id, admin);

    if (!data) {
      throw new AppError(
        404,
        "BAP_NOT_FOUND",
        "BAP tidak ditemukan atau tidak termasuk cakupan unit Anda.",
      );
    }

    return data;
  },

  async setujui(id: number, admin: AdminScope) {
    const result = await validasiRepository.setujui(id, admin);

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

  async tolak(id: number, input: TolakBapInput, admin: AdminScope) {
    const result = await validasiRepository.tolak(id, input, admin);

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
