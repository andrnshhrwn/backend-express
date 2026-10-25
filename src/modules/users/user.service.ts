import bcrypt from "bcrypt";
import { AppError } from "../../shared/errors/app-error";
import { prisma } from "../../lib/prisma";
import { userRepository } from "./user.repository";

type CreateUserInput = {
  fullname: string;
  username: string;
  password: string;
  role: "admin_pusat" | "admin_cabang" | "teknisi";
  id_unit?: number | null;
};

type UpdateUserInput = {
  fullname?: string;
  username?: string;
  password?: string;
  role?: "admin_pusat" | "admin_cabang" | "teknisi";
  id_unit?: number | null;
};

export const userService = {
  findAll() {
    return userRepository.findAll();
  },

  async findById(id_user: number) {
    const user = await userRepository.findById(id_user);

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "Pengguna tidak ditemukan");
    }

    return user;
  },

  async create(data: CreateUserInput) {
    const existingUser = await userRepository.findByUsername(data.username);

    if (existingUser) {
      throw new AppError(
        409,
        "USERNAME_ALREADY_EXISTS",
        "Username sudah digunakan",
      );
    }

    if (data.role === "admin_pusat" && data.id_unit != null) {
      throw new AppError(
        400,
        "INVALID_USER_UNIT",
        "Admin pusat tidak boleh terikat pada unit",
      );
    }

    if (data.role !== "admin_pusat" && data.id_unit == null) {
      throw new AppError(
        400,
        "USER_UNIT_REQUIRED",
        "Unit wajib diisi untuk admin cabang dan teknisi",
      );
    }

    if (data.id_unit != null) {
      const unit = await prisma.unit.findUnique({
        where: { id_unit: data.id_unit },
      });

      if (!unit) {
        throw new AppError(404, "UNIT_NOT_FOUND", "Unit tidak ditemukan");
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    return userRepository.create({
      fullname: data.fullname,
      username: data.username,
      password: hashedPassword,
      role: data.role,
      id_unit: data.id_unit ?? null,
    });
  },

  async update(id_user: number, data: UpdateUserInput) {
    const currentUser = await this.findById(id_user);

    if (data.username !== undefined) {
      const existingUser = await userRepository.findByUsername(data.username);

      if (existingUser && existingUser.id_user !== id_user) {
        throw new AppError(
          409,
          "USERNAME_ALREADY_EXISTS",
          "Username sudah digunakan",
        );
      }
    }

    const nextRole = data.role ?? currentUser.role;
    const nextUnit =
      data.id_unit !== undefined ? data.id_unit : currentUser.id_unit;

    if (nextRole === "admin_pusat" && nextUnit != null) {
      throw new AppError(
        400,
        "INVALID_USER_UNIT",
        "Admin pusat tidak boleh terikat pada unit",
      );
    }

    if (nextRole !== "admin_pusat" && nextUnit == null) {
      throw new AppError(
        400,
        "USER_UNIT_REQUIRED",
        "Unit wajib diisi untuk admin cabang dan teknisi",
      );
    }

    if (nextUnit != null) {
      const unit = await prisma.unit.findUnique({
        where: { id_unit: nextUnit },
      });

      if (!unit) {
        throw new AppError(404, "UNIT_NOT_FOUND", "Unit tidak ditemukan");
      }
    }

    const updateData: UpdateUserInput = { ...data };

    if (updateData.password !== undefined) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    return userRepository.update(id_user, updateData);
  },
};
