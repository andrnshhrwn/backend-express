import bcrypt from "bcrypt";
import { AppError } from "../../shared/errors/app-error.js";
import { prisma } from "../../lib/prisma.js";
import { userRepository } from "./user.repository.js";

type UserRole = "admin_pusat" | "admin_cabang" | "teknisi" | "pimpinan";

type CreateUserInput = {
  fullname: string;
  username: string;
  password: string;
  role: UserRole;
  id_unit?: string | null;
};

type CreateTeknisiInput = {
  fullname: string;
  username: string;
  password: string;
};

type UpdateUserInput = {
  fullname?: string;
  username?: string;
  password?: string;
  role?: UserRole;
  id_unit?: string | null;
};

// Role yang tidak terikat pada unit
const GLOBAL_ROLES: UserRole[] = ["admin_pusat", "pimpinan"];

function isGlobalRole(role: UserRole): boolean {
  return GLOBAL_ROLES.includes(role);
}

export const userService = {
  // ======================================================
  // FIND ALL USERS
  // ======================================================

  findAll() {
    return userRepository.findAll();
  },

  // ======================================================
  // FIND USER BY ID
  // ======================================================

  async findById(id_user: string) {
    const user = await userRepository.findById(id_user);

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "Pengguna tidak ditemukan");
    }

    return user;
  },

  // ======================================================
  // FIND TECHNICIAN BY UNIT
  // ======================================================

  async findTeknisiByUnit(id_unit: string | null) {
    if (id_unit === null) {
      throw new AppError(
        403,
        "UNIT_ACCESS_DENIED",
        "Pengguna tidak terikat pada unit",
      );
    }

    return userRepository.findTeknisiByUnit(id_unit);
  },

  // ======================================================
  // CREATE USER
  // Khusus Admin Pusat
  // ======================================================

  async create(data: CreateUserInput) {
    const existingUser = await userRepository.findByUsername(data.username);

    if (existingUser) {
      throw new AppError(
        409,
        "USERNAME_ALREADY_EXISTS",
        "Username sudah digunakan",
      );
    }

    // Admin Pusat dan Pimpinan tidak terikat unit
    if (isGlobalRole(data.role) && data.id_unit != null) {
      throw new AppError(
        400,
        "INVALID_USER_UNIT",
        "Role ini tidak boleh terikat pada unit",
      );
    }

    // Admin Cabang dan Teknisi wajib memiliki unit
    if (!isGlobalRole(data.role) && data.id_unit == null) {
      throw new AppError(
        400,
        "USER_UNIT_REQUIRED",
        "Unit wajib diisi untuk admin cabang dan teknisi",
      );
    }

    // Pastikan unit tersedia
    if (data.id_unit != null) {
      const unit = await prisma.unit.findUnique({
        where: {
          id_unit: data.id_unit,
        },
        select: {
          id_unit: true,
        },
      });

      if (!unit) {
        throw new AppError(404, "UNIT_NOT_FOUND", "Unit tidak ditemukan");
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    return userRepository.create({
      fullname: data.fullname,
      username: data.username,
      password: hashedPassword,
      role: data.role,
      id_unit: data.id_unit ?? null,
    });
  },

  // ======================================================
  // CREATE TECHNICIAN BY ADMIN CABANG
  // ======================================================

  async createTeknisiByUnit(data: CreateTeknisiInput, id_unit: string | null) {
    if (id_unit === null) {
      throw new AppError(
        403,
        "UNIT_ACCESS_DENIED",
        "Admin cabang tidak terikat pada unit",
      );
    }

    const existingUser = await userRepository.findByUsername(data.username);

    if (existingUser) {
      throw new AppError(
        409,
        "USERNAME_ALREADY_EXISTS",
        "Username sudah digunakan",
      );
    }

    const unit = await prisma.unit.findUnique({
      where: {
        id_unit,
      },
      select: {
        id_unit: true,
      },
    });

    if (!unit) {
      throw new AppError(404, "UNIT_NOT_FOUND", "Unit tidak ditemukan");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    return userRepository.create({
      fullname: data.fullname,
      username: data.username,
      password: hashedPassword,
      role: "teknisi",
      id_unit,
    });
  },

  // ======================================================
  // UPDATE USER
  // ======================================================

  async update(id_user: string, data: UpdateUserInput) {
    const currentUser = await this.findById(id_user);

    // Cek username duplikat
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

    // Admin Pusat dan Pimpinan tidak boleh terikat unit
    if (isGlobalRole(nextRole) && nextUnit != null) {
      throw new AppError(
        400,
        "INVALID_USER_UNIT",
        "Role ini tidak boleh terikat pada unit",
      );
    }

    // Admin Cabang dan Teknisi wajib memiliki unit
    if (!isGlobalRole(nextRole) && nextUnit == null) {
      throw new AppError(
        400,
        "USER_UNIT_REQUIRED",
        "Unit wajib diisi untuk admin cabang dan teknisi",
      );
    }

    // Validasi unit
    if (nextUnit != null) {
      const unit = await prisma.unit.findUnique({
        where: {
          id_unit: nextUnit,
        },
        select: {
          id_unit: true,
        },
      });

      if (!unit) {
        throw new AppError(404, "UNIT_NOT_FOUND", "Unit tidak ditemukan");
      }
    }

    const updateData: UpdateUserInput = {
      ...data,
    };

    // Hash password jika diperbarui
    if (updateData.password !== undefined) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    return userRepository.update(id_user, updateData);
  },
};
