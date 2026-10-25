import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors/app-error";
import { authRepository } from "./auth.repository";

export const authService = {
  async login(username: string, password: string) {
    const user = await authRepository.findByUsername(username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError(
        401,
        "INVALID_CREDENTIALS",
        "Username atau password salah",
      );
    }

    const payload = {
      id_user: user.id_user,
      role: user.role,
      id_unit: user.id_unit,
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
      },
    };
  },

  async me(id_user: number) {
    const user = await authRepository.findById(id_user);

    if (!user) {
      throw new AppError(401, "USER_NOT_FOUND", "Pengguna tidak ditemukan");
    }

    return user;
  },
};
