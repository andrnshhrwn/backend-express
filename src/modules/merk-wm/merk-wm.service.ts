import { AppError } from "../../shared/errors/app-error.js";
import { merkWmRepository } from "./merk-wm.repository.js";

type MerkWmInput = {
  kode_wm: string;
  merk_wm: string;
  wm_digit: number;
};

export const merkWmService = {
  findAll() {
    return merkWmRepository.findAll();
  },

  async findById(id_merk: string) {
    const merk = await merkWmRepository.findById(id_merk);

    if (!merk) {
      throw new AppError(404, "MERK_WM_NOT_FOUND", "Merek WM tidak ditemukan");
    }

    return merk;
  },

  async create(data: MerkWmInput) {
    const existing = await merkWmRepository.findAll();

    const duplicateCode = existing.some(
      (item) => item.kode_wm.toLowerCase() === data.kode_wm.toLowerCase(),
    );

    if (duplicateCode) {
      throw new AppError(
        409,
        "MERK_WM_CODE_ALREADY_EXISTS",
        "Kode WM sudah digunakan",
      );
    }

    const duplicateName = existing.some(
      (item) => item.merk_wm.toLowerCase() === data.merk_wm.toLowerCase(),
    );

    if (duplicateName) {
      throw new AppError(
        409,
        "MERK_WM_ALREADY_EXISTS",
        "Nama merek WM sudah digunakan",
      );
    }

    return merkWmRepository.create(data);
  },

  async update(id_merk: string, data: MerkWmInput) {
    await this.findById(id_merk);

    const existing = await merkWmRepository.findAll();

    const duplicateCode = existing.some(
      (item) =>
        item.id_merk !== id_merk &&
        item.kode_wm.toLowerCase() === data.kode_wm.toLowerCase(),
    );

    if (duplicateCode) {
      throw new AppError(
        409,
        "MERK_WM_CODE_ALREADY_EXISTS",
        "Kode WM sudah digunakan",
      );
    }

    const duplicateName = existing.some(
      (item) =>
        item.id_merk !== id_merk &&
        item.merk_wm.toLowerCase() === data.merk_wm.toLowerCase(),
    );

    if (duplicateName) {
      throw new AppError(
        409,
        "MERK_WM_ALREADY_EXISTS",
        "Nama merek WM sudah digunakan",
      );
    }

    return merkWmRepository.update(id_merk, data);
  },

  async delete(id_merk: string) {
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
