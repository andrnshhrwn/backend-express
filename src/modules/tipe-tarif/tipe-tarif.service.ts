import { AppError } from "../../shared/errors/app-error";
import { tipeTarifRepository } from "./tipe-tarif.repository";

type TipeTarifInput = {
  kode_tarif: string;
  nama_tarif: string;
};

export const tipeTarifService = {
  async findAll() {
    const tarifList = await tipeTarifRepository.findAll();

    return tarifList.map((tarif) => ({
      id_tarif: tarif.id_tarif,
      kode_tarif: tarif.kode_tarif,
      nama_tarif: tarif.nama_tarif,
      jumlahPelanggan: tarif._count.pelanggan,
    }));
  },

  async findById(id_tarif: string) {
    const tarif = await tipeTarifRepository.findById(id_tarif);

    if (!tarif) {
      throw new AppError(
        404,
        "TIPE_TARIF_NOT_FOUND",
        "Tipe tarif tidak ditemukan",
      );
    }

    return tarif;
  },

  async create(data: TipeTarifInput) {
    const existing = await tipeTarifRepository.findAll();

    const duplicateCode = existing.some(
      (item) => item.kode_tarif.toLowerCase() === data.kode_tarif.toLowerCase(),
    );

    if (duplicateCode) {
      throw new AppError(
        409,
        "TIPE_TARIF_CODE_ALREADY_EXISTS",
        "Kode tarif sudah digunakan",
      );
    }

    const duplicateName = existing.some(
      (item) => item.nama_tarif.toLowerCase() === data.nama_tarif.toLowerCase(),
    );

    if (duplicateName) {
      throw new AppError(
        409,
        "TIPE_TARIF_NAME_ALREADY_EXISTS",
        "Nama tarif sudah digunakan",
      );
    }

    return tipeTarifRepository.create(data);
  },

  async update(id_tarif: string, data: TipeTarifInput) {
    await this.findById(id_tarif);

    const existing = await tipeTarifRepository.findAll();

    const duplicateCode = existing.some(
      (item) =>
        item.id_tarif !== id_tarif &&
        item.kode_tarif.toLowerCase() === data.kode_tarif.toLowerCase(),
    );

    if (duplicateCode) {
      throw new AppError(
        409,
        "TIPE_TARIF_CODE_ALREADY_EXISTS",
        "Kode tarif sudah digunakan",
      );
    }

    const duplicateName = existing.some(
      (item) =>
        item.id_tarif !== id_tarif &&
        item.nama_tarif.toLowerCase() === data.nama_tarif.toLowerCase(),
    );

    if (duplicateName) {
      throw new AppError(
        409,
        "TIPE_TARIF_NAME_ALREADY_EXISTS",
        "Nama tarif sudah digunakan",
      );
    }

    return tipeTarifRepository.update(id_tarif, data);
  },

  async delete(id_tarif: string) {
    await this.findById(id_tarif);

    const hasRelations = await tipeTarifRepository.hasRelations(id_tarif);

    if (hasRelations) {
      throw new AppError(
        409,
        "TIPE_TARIF_HAS_RELATIONS",
        "Tipe tarif tidak dapat dihapus karena masih digunakan pelanggan",
      );
    }

    await tipeTarifRepository.delete(id_tarif);

    return {
      id_tarif,
      message: "Tipe tarif berhasil dihapus",
    };
  },
};
