import { AppError } from "../../shared/errors/app-error";
import { unitRepository } from "./unit.repository";

export const unitService = {
  async findAll() {
    return unitRepository.findAll();
  },

  async findById(id_unit: number) {
    const unit = await unitRepository.findById(id_unit);

    if (!unit) {
      throw new AppError(404, "UNIT_NOT_FOUND", "Unit tidak ditemukan");
    }

    return unit;
  },

  async create(nama_unit: string) {
    const existingUnits = await unitRepository.findAll();

    const duplicate = existingUnits.some(
      (unit) => unit.nama_unit.toLowerCase() === nama_unit.toLowerCase(),
    );

    if (duplicate) {
      throw new AppError(
        409,
        "UNIT_ALREADY_EXISTS",
        "Nama unit sudah digunakan",
      );
    }

    return unitRepository.create(nama_unit);
  },

  async update(id_unit: number, nama_unit: string) {
    const unit = await unitRepository.findById(id_unit);

    if (!unit) {
      throw new AppError(404, "UNIT_NOT_FOUND", "Unit tidak ditemukan");
    }

    const existingUnits = await unitRepository.findAll();

    const duplicate = existingUnits.some(
      (item) =>
        item.id_unit !== id_unit &&
        item.nama_unit.toLowerCase() === nama_unit.toLowerCase(),
    );

    if (duplicate) {
      throw new AppError(
        409,
        "UNIT_ALREADY_EXISTS",
        "Nama unit sudah digunakan",
      );
    }

    return unitRepository.update(id_unit, nama_unit);
  },

  async delete(id_unit: number) {
    await this.findById(id_unit);

    const hasRelations = await unitRepository.hasRelations(id_unit);

    if (hasRelations) {
      throw new AppError(
        409,
        "UNIT_HAS_RELATIONS",
        "Unit tidak dapat dihapus karena masih digunakan oleh data lain",
      );
    }

    await unitRepository.delete(id_unit);

    return {
      id_unit,
      message: "Unit berhasil dihapus",
    };
  },
};
