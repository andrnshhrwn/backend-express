import { AppError } from "../../shared/errors/app-error";
import { pelangganRepository } from "./pelanggan.repository";
import { prisma } from "../../lib/prisma";

type CreatePelangganInput = {
  id_pelanggan_pdam: string;
  id_unit: number;
  nama: string;
  alamat: string;
  id_tarif: string;
  wm_no_seri_aktif?: string | null;
};

type UpdatePelangganInput = Partial<CreatePelangganInput>;

export const pelangganService = {
  findAll() {
    return pelangganRepository.findAll();
  },

  async findById(id_pelanggan: number) {
    const pelanggan = await pelangganRepository.findById(id_pelanggan);

    if (!pelanggan) {
      throw new AppError(
        404,
        "PELANGGAN_NOT_FOUND",
        "Pelanggan tidak ditemukan",
      );
    }

    return pelanggan;
  },

  async create(data: CreatePelangganInput) {
    const existingPelanggan = await pelangganRepository.findByPdamId(
      data.id_pelanggan_pdam,
    );

    if (existingPelanggan) {
      throw new AppError(
        409,
        "PELANGGAN_ID_ALREADY_EXISTS",
        "Nomor pelanggan PDAM sudah digunakan",
      );
    }

    const unit = await prisma.unit.findUnique({
      where: { id_unit: data.id_unit },
    });

    if (!unit) {
      throw new AppError(404, "UNIT_NOT_FOUND", "Unit tidak ditemukan");
    }

    const tarif = await prisma.tipeTarif.findUnique({
      where: { id_tarif: data.id_tarif },
    });

    if (!tarif) {
      throw new AppError(
        404,
        "TIPE_TARIF_NOT_FOUND",
        "Tipe tarif tidak ditemukan",
      );
    }

    return pelangganRepository.create(data);
  },

  async update(id_pelanggan: number, data: UpdatePelangganInput) {
    await this.findById(id_pelanggan);

    if (data.id_pelanggan_pdam !== undefined) {
      const existingPelanggan = await pelangganRepository.findByPdamId(
        data.id_pelanggan_pdam,
      );

      if (
        existingPelanggan &&
        existingPelanggan.id_pelanggan !== id_pelanggan
      ) {
        throw new AppError(
          409,
          "PELANGGAN_ID_ALREADY_EXISTS",
          "Nomor pelanggan PDAM sudah digunakan",
        );
      }
    }

    if (data.id_unit !== undefined) {
      const unit = await prisma.unit.findUnique({
        where: { id_unit: data.id_unit },
      });

      if (!unit) {
        throw new AppError(404, "UNIT_NOT_FOUND", "Unit tidak ditemukan");
      }
    }

    if (data.id_tarif !== undefined) {
      const tarif = await prisma.tipeTarif.findUnique({
        where: { id_tarif: data.id_tarif },
      });

      if (!tarif) {
        throw new AppError(
          404,
          "TIPE_TARIF_NOT_FOUND",
          "Tipe tarif tidak ditemukan",
        );
      }
    }

    return pelangganRepository.update(id_pelanggan, data);
  },

  async delete(id_pelanggan: number) {
    await this.findById(id_pelanggan);

    const hasRelations = await pelangganRepository.hasRelations(id_pelanggan);

    if (hasRelations) {
      throw new AppError(
        409,
        "PELANGGAN_HAS_PENUGASAN",
        "Pelanggan tidak dapat dihapus karena memiliki riwayat penugasan",
      );
    }

    await pelangganRepository.delete(id_pelanggan);

    return {
      id_pelanggan,
      message: "Pelanggan berhasil dihapus",
    };
  },
};
