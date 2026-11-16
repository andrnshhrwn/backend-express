import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors/app-error";
import { authRepository } from "./auth.repository";
import { canAccess } from "../../config/accessPolicy";

const platformSchema = z.enum(["web", "android"]);

export const authService = {
  async login(username: string, password: string, clientPlatform: unknown) {
    const platformResult = platformSchema.safeParse(clientPlatform);

    if (!platformResult.success) {
      throw new AppError(400, "INVALID_PLATFORM", "Platform klien tidak valid");
    }

    const platform = platformResult.data;

    const user = await authRepository.findByUsername(username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError(
        401,
        "INVALID_CREDENTIALS",
        "Username atau password salah",
      );
    }

    if (!canAccess(user.role, platform)) {
      throw new AppError(
        403,
        "PLATFORM_NOT_ALLOWED",
        "Akses tidak diizinkan dari platform ini",
      );
    }

    const payload = {
      id_user: user.id_user,
      role: user.role,
      id_unit: user.id_unit,
      platform,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });

    return {
      token,
      user: {
        id_user: user.id_user,
        fullname: user.fullname,
        username: user.username,
        role: user.role,
        id_unit: user.id_unit,
        nama_unit: user.unit?.nama_unit ?? null,
      },
    };
  },

  async me(id_user: string) {
    const user = await authRepository.findById(id_user);

    if (!user) {
      throw new AppError(401, "USER_NOT_FOUND", "Pengguna tidak ditemukan");
    }

    return {
      id_user: user.id_user,
      fullname: user.fullname,
      username: user.username,
      role: user.role,
      id_unit: user.id_unit,
      nama_unit: user.unit?.nama_unit ?? null,
    };
  },
};
