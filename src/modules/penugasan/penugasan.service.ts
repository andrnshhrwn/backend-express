import { AuthUser } from "../../middlewares/authenticate";
import { AppError } from "../../shared/errors/app-error";
import { penugasanRepository } from "./penugasan.repository";

type CreatePenugasanInput = {
  id_pelanggan: number;
  id_unit: number;
  tgl_penugasan?: Date;
  alasan: string;
  id_teknisi: number;
};

type UpdatePenugasanInput = {
  id_unit?: number;
  tgl_penugasan?: Date;
  alasan?: string;
  id_teknisi?: number;
  status?: "pending" | "proses" | "selesai" | "dibatalkan";
};

export const penugasanService = {
  async getAll(user: AuthUser) {
    return penugasanRepository.findAll(buildAccessScope(user));
  },

  async getById(id: number, user: AuthUser) {
    const data = await penugasanRepository.findById(id, buildAccessScope(user));

    if (!data) {
      throw new AppError(
        404,
        "PENUGASAN_NOT_FOUND",
        "Data penugasan tidak ditemukan.",
      );
    }

    return data;
  },

  async validateReferences(idPelanggan: number, idUnit: number) {
    const [pelanggan, unit] = await Promise.all([
      penugasanRepository.findPelangganById(idPelanggan),
      penugasanRepository.findUnitById(idUnit),
    ]);

    if (!pelanggan) {
      throw new AppError(
        404,
        "PELANGGAN_NOT_FOUND",
        "Pelanggan tidak ditemukan.",
      );
    }

    if (!unit) {
      throw new AppError(404, "UNIT_NOT_FOUND", "Unit tidak ditemukan.");
    }

    if (pelanggan.id_unit !== idUnit) {
      throw new AppError(
        422,
        "UNIT_PELANGGAN_MISMATCH",
        "Unit SPK harus sesuai dengan unit pelanggan.",
      );
    }

    return { pelanggan, unit };
  },

  async validateTeknisi(idTeknisi: number) {
    const teknisi = await penugasanRepository.findTeknisiById(idTeknisi);

    if (!teknisi) {
      throw new AppError(
        422,
        "INVALID_TEKNISI",
        "User yang dipilih bukan teknisi yang valid.",
      );
    }
  },

  async create(data: CreatePenugasanInput, user: AuthUser) {
    assertAdmin(user);

    const { pelanggan } = await this.validateReferences(
      data.id_pelanggan,
      data.id_unit,
    );

    if (user.role === "admin_cabang" && user.id_unit !== data.id_unit) {
      throw new AppError(
        403,
        "FORBIDDEN_UNIT",
        "Admin cabang hanya dapat membuat SPK untuk unitnya sendiri.",
      );
    }

    await this.validateTeknisi(data.id_teknisi);

    const active = await penugasanRepository.findActiveByPelangganId(
      pelanggan.id_pelanggan,
    );

    if (active) {
      throw new AppError(
        409,
        "ACTIVE_PENUGASAN_EXISTS",
        "Pelanggan masih memiliki SPK aktif dengan status pending atau proses.",
      );
    }

    return penugasanRepository.create({
      ...data,
      id_user_penugasan: user.id_user,
    });
  },

  async update(id: number, data: UpdatePenugasanInput, user: AuthUser) {
    assertAdmin(user);

    const current = await this.getById(id, user);

    const targetUnit = data.id_unit ?? current.id_unit;

    if (user.role === "admin_cabang" && user.id_unit !== targetUnit) {
      throw new AppError(
        403,
        "FORBIDDEN_UNIT",
        "Admin cabang hanya dapat mengelola SPK unitnya sendiri.",
      );
    }

    if (data.id_unit !== undefined) {
      const { pelanggan } = await this.validateReferences(
        current.id_pelanggan,
        data.id_unit,
      );

      if (pelanggan.id_unit !== data.id_unit) {
        throw new AppError(
          422,
          "UNIT_PELANGGAN_MISMATCH",
          "Unit SPK harus sesuai dengan unit pelanggan.",
        );
      }
    }

    if (data.id_teknisi !== undefined) {
      await this.validateTeknisi(data.id_teknisi);
    }

    if (data.status === "pending" || data.status === "proses") {
      const active = await penugasanRepository.findActiveByPelangganId(
        current.id_pelanggan,
      );

      if (active && active.id_penugasan !== id) {
        throw new AppError(
          409,
          "ACTIVE_PENUGASAN_EXISTS",
          "Pelanggan sudah memiliki SPK aktif lainnya.",
        );
      }
    }

    return penugasanRepository.update(id, data);
  },

  async delete(id: number, user: AuthUser) {
    if (user.role !== "admin_pusat") {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Hanya admin pusat yang dapat menghapus SPK.",
      );
    }

    await this.getById(id, user);

    const penggantian =
      await penugasanRepository.findPenggantianByPenugasanId(id);

    if (penggantian) {
      throw new AppError(
        409,
        "PENUGASAN_HAS_PENGGANTIAN",
        "Penugasan tidak dapat dihapus karena sudah memiliki data penggantian meter.",
      );
    }

    return penugasanRepository.delete(id);
  },
};

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

function assertAdmin(user: AuthUser) {
  if (user.role !== "admin_pusat" && user.role !== "admin_cabang") {
    throw new AppError(
      403,
      "FORBIDDEN",
      "Hanya admin yang dapat mengelola SPK.",
    );
  }
}
