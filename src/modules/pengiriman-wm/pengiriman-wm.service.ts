import { AppError } from "../../shared/errors/app-error";
import { prisma } from "../../lib/prisma";
import { pengirimanWmRepository } from "./pengiriman-wm.repository";

type DetailPengirimanInput = {
  id_merk: number;
  ukuran_dn: string;
  jumlah: number;
};

type CreatePengirimanInput = {
  no_pengiriman: string;
  id_unit_tujuan: number;
  tgl_pengiriman: string | Date;
  catatan?: string | null;
  details: DetailPengirimanInput[];
};

type UpdatePengirimanInput = {
  no_pengiriman?: string;
  id_unit_tujuan?: number;
  tgl_pengiriman?: string | Date;
  catatan?: string | null;
};

export const pengirimanWmService = {
  findAll() {
    return pengirimanWmRepository.findAll();
  },

  async findById(id_pengiriman: number) {
    const pengiriman = await pengirimanWmRepository.findById(id_pengiriman);

    if (!pengiriman) {
      throw new AppError(
        404,
        "PENGIRIMAN_NOT_FOUND",
        "Data pengiriman WM tidak ditemukan",
      );
    }

    return pengiriman;
  },

  async create(data: CreatePengirimanInput, id_user_pusat: number) {
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
      where: { id_unit: data.id_unit_tujuan },
      select: { id_unit: true },
    });

    if (!unit) {
      throw new AppError(404, "UNIT_NOT_FOUND", "Unit tujuan tidak ditemukan");
    }

    if (!Array.isArray(data.details) || data.details.length === 0) {
      throw new AppError(
        400,
        "DETAILS_REQUIRED",
        "Minimal harus ada satu detail WM",
      );
    }

    const merkIds = [...new Set(data.details.map((item) => item.id_merk))];

    const merks = await prisma.merkWm.findMany({
      where: { id_merk: { in: merkIds } },
      select: { id_merk: true },
    });

    if (merks.length !== merkIds.length) {
      throw new AppError(
        404,
        "MERK_WM_NOT_FOUND",
        "Satu atau lebih merk WM tidak ditemukan",
      );
    }

    return pengirimanWmRepository.create({
      no_pengiriman: data.no_pengiriman,
      id_unit_tujuan: data.id_unit_tujuan,
      tgl_pengiriman: new Date(data.tgl_pengiriman),
      catatan: data.catatan ?? null,
      id_user_pusat,
      details: data.details,
    });
  },

  async update(id_pengiriman: number, data: UpdatePengirimanInput) {
    await this.findById(id_pengiriman);

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

    if (data.id_unit_tujuan !== undefined) {
      const unit = await prisma.unit.findUnique({
        where: { id_unit: data.id_unit_tujuan },
        select: { id_unit: true },
      });

      if (!unit) {
        throw new AppError(
          404,
          "UNIT_NOT_FOUND",
          "Unit tujuan tidak ditemukan",
        );
      }
    }

    const updateData: {
      no_pengiriman?: string;
      id_unit_tujuan?: number;
      tgl_pengiriman?: Date;
      catatan?: string | null;
    } = {};

    if (data.no_pengiriman !== undefined) {
      updateData.no_pengiriman = data.no_pengiriman;
    }

    if (data.id_unit_tujuan !== undefined) {
      updateData.id_unit_tujuan = data.id_unit_tujuan;
    }

    if (data.tgl_pengiriman !== undefined) {
      updateData.tgl_pengiriman = new Date(data.tgl_pengiriman);
    }

    if (data.catatan !== undefined) {
      updateData.catatan = data.catatan;
    }

    return pengirimanWmRepository.update(id_pengiriman, updateData);
  },

  async delete(id_pengiriman: number) {
    await this.findById(id_pengiriman);
    return pengirimanWmRepository.delete(id_pengiriman);
  },
};
