import { AppError } from "../../shared/errors/app-error";
import { penggantianWmRepository } from "./penggantian-wm.repository";
import type {
  CreatePenggantianWmInput,
  ListPenggantianWmQuery,
} from "./penggantian-wm.validator";
import type { AuthUser } from "../../middlewares/authenticate";

function buildAccessScope(user: AuthUser) {
  if (user.role === "admin_pusat") {
    return {};
  }

  if (user.role === "admin_cabang") {
    if (user.id_unit === null) {
      throw new AppError(
        403,
        "UNIT_ACCESS_DENIED",
        "Akun admin cabang tidak memiliki unit.",
      );
    }

    return { id_unit: user.id_unit };
  }

  return { id_teknisi: user.id_user };
}

export const penggantianWmService = {
  async getAll(filters: ListPenggantianWmQuery, user: AuthUser) {
    const scope = buildAccessScope(user);
    return penggantianWmRepository.findAll(filters, scope);
  },

  async getById(id: number, user: AuthUser) {
    const scope = buildAccessScope(user);
    const data = await penggantianWmRepository.findById(id, scope);

    if (!data) {
      throw new AppError(404, "BAP_NOT_FOUND", "Data BAP tidak ditemukan.");
    }

    return data;
  },

  async create(input: CreatePenggantianWmInput, idTeknisi: number) {
    const result = await penggantianWmRepository.create(input, idTeknisi);

    switch (result.kind) {
      case "PENUGASAN_NOT_FOUND":
        throw new AppError(404, "PENUGASAN_NOT_FOUND", "SPK tidak ditemukan.");

      case "FORBIDDEN_TEKNISI":
        throw new AppError(
          403,
          "FORBIDDEN_TEKNISI",
          "Kamu tidak ditugaskan pada SPK ini.",
        );

      case "PENUGASAN_TIDAK_AKTIF":
        throw new AppError(
          409,
          "PENUGASAN_TIDAK_AKTIF",
          "SPK yang selesai atau dibatalkan tidak dapat menerima BAP baru.",
        );

      case "BAP_MENUNGGU":
        throw new AppError(
          409,
          "BAP_MENUNGGU",
          "Masih ada BAP yang menunggu validasi untuk SPK ini.",
        );

      case "BAP_SUDAH_DISETUJUI":
        throw new AppError(
          409,
          "BAP_SUDAH_DISETUJUI",
          "SPK ini sudah memiliki BAP yang disetujui.",
        );

      case "CREATED":
        return result.data;
    }
  },
};
