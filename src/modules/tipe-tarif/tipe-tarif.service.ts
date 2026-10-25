import { AppError } from "../../shared/errors/app-error";
import { tipeTarifRepository } from "./tipe-tarif.repository";

export const tipeTarifService = {
  findAll() {
    return tipeTarifRepository.findAll();
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

  async create(data: { id_tarif: string; nama_tarif: string }) {
    const existingId = await tipeTarifRepository.findById(data.id_tarif);

    if (existingId) {
      throw new AppError(
        409,
        "TIPE_TARIF_ID_ALREADY_EXISTS",
        "ID tarif sudah digunakan",
      );
    }

    const existingName = await tipeTarifRepository.findByName(data.nama_tarif);

    if (existingName) {
      throw new AppError(
        409,
        "TIPE_TARIF_NAME_ALREADY_EXISTS",
        "Nama tarif sudah digunakan",
      );
    }

    return tipeTarifRepository.create(data);
  },

  async update(id_tarif: string, data: { nama_tarif: string }) {
    await this.findById(id_tarif);

    const existingName = await tipeTarifRepository.findByName(data.nama_tarif);

    if (existingName && existingName.id_tarif !== id_tarif) {
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
