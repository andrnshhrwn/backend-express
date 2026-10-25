import { AppError } from "../../shared/errors/app-error";
import { merkWmRepository } from "./merk-wm.repository";

export const merkWmService = {
  findAll() {
    return merkWmRepository.findAll();
  },

  async findById(id_merk: number) {
    const merk = await merkWmRepository.findById(id_merk);

    if (!merk) {
      throw new AppError(404, "MERK_WM_NOT_FOUND", "Merek WM tidak ditemukan");
    }

    return merk;
  },

  async create(data: { merk_wm: string; wm_digit: number }) {
    const existing = await merkWmRepository.findByName(data.merk_wm);

    if (existing) {
      throw new AppError(
        409,
        "MERK_WM_ALREADY_EXISTS",
        "Nama merek WM sudah digunakan",
      );
    }

    return merkWmRepository.create(data);
  },

  async update(id_merk: number, data: { merk_wm: string; wm_digit: number }) {
    await this.findById(id_merk);

    const existing = await merkWmRepository.findByName(data.merk_wm);

    if (existing && existing.id_merk !== id_merk) {
      throw new AppError(
        409,
        "MERK_WM_ALREADY_EXISTS",
        "Nama merek WM sudah digunakan",
      );
    }

    return merkWmRepository.update(id_merk, data);
  },

  async delete(id_merk: number) {
    await this.findById(id_merk);

    const hasRelations = await merkWmRepository.hasRelations(id_merk);

    if (hasRelations) {
      throw new AppError(
        409,
        "MERK_WM_HAS_RELATIONS",
        "Merek WM tidak dapat dihapus karena sudah digunakan pada detail pengiriman",
      );
    }

    await merkWmRepository.delete(id_merk);

    return {
      id_merk,
      message: "Merek WM berhasil dihapus",
    };
  },
};
