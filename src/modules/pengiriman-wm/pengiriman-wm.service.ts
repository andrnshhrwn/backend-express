import { AppError } from "../../shared/errors/app-error";
import { prisma } from "../../lib/prisma";
import type { AuthUser } from "../../middlewares/authenticate";
import { pengirimanWmRepository } from "./pengiriman-wm.repository";

type DetailPengirimanInput = {
  id_merk: string;
  ukuran_dn: string;
  jumlah: number;
};

type CreatePengirimanInput = {
  no_pengiriman: string;
  tgl_pengiriman: string | Date;
  catatan?: string | null;
  details: DetailPengirimanInput[];
};

type UpdatePengirimanInput = {
  no_pengiriman?: string;
  tgl_pengiriman?: string | Date;
  catatan?: string | null;
  details?: DetailPengirimanInput[];
};

function getBranchUnitId(user: AuthUser): string {
  if (user.role !== "admin_cabang") {
    throw new AppError(
      403,
      "FORBIDDEN",
      "Hanya Admin Cabang yang dapat mengelola pengiriman WM",
    );
  }

  if (typeof user.id_unit !== "string" || !user.id_unit) {
    throw new AppError(
      403,
      "UNIT_NOT_ASSIGNED",
      "Akun Admin Cabang belum terhubung dengan unit",
    );
  }

  return user.id_unit;
}

function getReadUnitScope(user: AuthUser): string | undefined {
  if (user.role === "admin_pusat") {
    return undefined;
  }

  if (user.role === "admin_cabang") {
    return getBranchUnitId(user);
  }

  throw new AppError(
    403,
    "FORBIDDEN",
    "Kamu tidak memiliki akses ke data pengiriman WM",
  );
}

export const pengirimanWmService = {
  findAll(user: AuthUser) {
    const id_unit = getReadUnitScope(user);

    return pengirimanWmRepository.findAll(id_unit);
  },

  async findById(id_pengiriman: string, user: AuthUser) {
    const id_unit = getReadUnitScope(user);

    const pengiriman = await pengirimanWmRepository.findById(
      id_pengiriman,
      id_unit,
    );

    if (!pengiriman) {
      throw new AppError(
        404,
        "PENGIRIMAN_NOT_FOUND",
        "Data pengiriman WM tidak ditemukan",
      );
    }

    return pengiriman;
  },

  async create(data: CreatePengirimanInput, user: AuthUser) {
    const id_unit_tujuan = getBranchUnitId(user);

    const existing = await pengirimanWmRepository.findByNoPengiriman(
      data.no_pengiriman,
    );

    if (existing) {
      throw new AppError(
        409,
        "NO_PENGIRIMAN_ALREADY_EXISTS",
        "Nomor pengiriman sudah digunakan",
      );
    }

    const unit = await prisma.unit.findUnique({
      where: {
        id_unit: id_unit_tujuan,
      },
      select: {
        id_unit: true,
      },
    });

    if (!unit) {
      throw new AppError(
        404,
        "UNIT_NOT_FOUND",
        "Unit pengguna tidak ditemukan",
      );
    }

    if (!Array.isArray(data.details) || data.details.length === 0) {
      throw new AppError(
        400,
        "DETAILS_REQUIRED",
        "Minimal harus ada satu detail WM",
      );
    }

    await this.validateMerk(data.details);

    return pengirimanWmRepository.create({
      no_pengiriman: data.no_pengiriman,
      id_unit_tujuan,
      tgl_pengiriman: new Date(data.tgl_pengiriman),
      catatan: data.catatan ?? null,
      id_user_pencatat: user.id_user,
      details: data.details,
    });
  },

  async update(
    id_pengiriman: string,
    data: UpdatePengirimanInput,
    user: AuthUser,
  ) {
    const id_unit = getBranchUnitId(user);

    // Memastikan pengiriman memang milik unit Admin Cabang yang login.
    await this.findById(id_pengiriman, user);

    if (data.no_pengiriman !== undefined) {
      const existing = await pengirimanWmRepository.findByNoPengiriman(
        data.no_pengiriman,
      );

      if (existing && existing.id_pengiriman !== id_pengiriman) {
        throw new AppError(
          409,
          "NO_PENGIRIMAN_ALREADY_EXISTS",
          "Nomor pengiriman sudah digunakan",
        );
      }
    }

    if (data.details !== undefined) {
      if (!Array.isArray(data.details) || data.details.length === 0) {
        throw new AppError(
          400,
          "DETAILS_REQUIRED",
          "Minimal harus ada satu detail WM",
        );
      }

      await this.validateMerk(data.details);
    }

    const updateData: {
      no_pengiriman?: string;
      tgl_pengiriman?: Date;
      catatan?: string | null;
      details?: DetailPengirimanInput[];
    } = {};

    if (data.no_pengiriman !== undefined) {
      updateData.no_pengiriman = data.no_pengiriman;
    }

    if (data.tgl_pengiriman !== undefined) {
      updateData.tgl_pengiriman = new Date(data.tgl_pengiriman);
    }

    if (data.catatan !== undefined) {
      updateData.catatan = data.catatan;
    }

    if (data.details !== undefined) {
      updateData.details = data.details;
    }

    // id_unit_tujuan tidak dapat diubah melalui proses update.
    // Pengecekan kepemilikan dilakukan kembali sebelum mutasi.
    const pengiriman = await pengirimanWmRepository.findById(
      id_pengiriman,
      id_unit,
    );

    if (!pengiriman) {
      throw new AppError(
        404,
        "PENGIRIMAN_NOT_FOUND",
        "Data pengiriman WM tidak ditemukan",
      );
    }

    return pengirimanWmRepository.update(id_pengiriman, updateData);
  },

  async delete(id_pengiriman: string, user: AuthUser) {
    // findById membatasi pencarian berdasarkan unit Admin Cabang.
    await this.findById(id_pengiriman, user);

    return pengirimanWmRepository.delete(id_pengiriman);
  },

  async validateMerk(details: DetailPengirimanInput[]) {
    const merkIds = [...new Set(details.map((item) => item.id_merk))];

    const merks = await prisma.merkWm.findMany({
      where: {
        id_merk: {
          in: merkIds,
        },
      },
      select: {
        id_merk: true,
      },
    });

    if (merks.length !== merkIds.length) {
      throw new AppError(
        404,
        "MERK_WM_NOT_FOUND",
        "Satu atau lebih merk WM tidak ditemukan",
      );
    }
  },
};
