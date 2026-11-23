import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { z } from "zod";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors/app-error";
import { authRepository } from "./auth.repository";
import { canAccess } from "../../config/accessPolicy";
import { prisma } from "../../lib/prisma";

const platformSchema = z.enum(["web", "android"]);

const sha256 = (s: string) =>
  crypto.createHash("sha256").update(s).digest("hex");

const newRaw = () => crypto.randomBytes(48).toString("base64url");

const refreshExpiry = () =>
  new Date(Date.now() + env.REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

function signAccess(
  user: { id_user: string; role: string; id_unit: string | null },
  platform: string,
) {
  return jwt.sign(
    { id_user: user.id_user, role: user.role, id_unit: user.id_unit, platform },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );
}

async function issueRefresh(
  id_user: string,
  platform: string,
  family_id: string = crypto.randomUUID(),
) {
  const raw = newRaw();

  await prisma.refreshToken.create({
    data: {
      id_user,
      token_hash: sha256(raw),
      family_id,
      platform,
      expires_at: refreshExpiry(),
    },
  });

  return raw;
}

function toUserDto(user: {
  id_user: string;
  fullname: string;
  username: string;
  role: string;
  id_unit: string | null;
  unit: { nama_unit: string } | null;
}) {
  return {
    id_user: user.id_user,
    fullname: user.fullname,
    username: user.username,
    role: user.role,
    id_unit: user.id_unit,
    nama_unit: user.unit?.nama_unit ?? null,
  };
}

async function revokeFamily(family_id: string) {
  await prisma.refreshToken.updateMany({
    where: { family_id, revoked_at: null },
    data: { revoked_at: new Date() },
  });
}

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

    const token = signAccess(user, platform);
    const refresh_token = await issueRefresh(user.id_user, platform);

    return {
      token,
      refresh_token,
      user: toUserDto(user),
    };
  },

  async refresh(rawToken: string) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token_hash: sha256(rawToken) },
    });

    if (!stored) {
      throw new AppError(
        401,
        "INVALID_REFRESH_TOKEN",
        "Refresh token tidak valid",
      );
    }

    // Token lama dipakai ulang -> cabut seluruh keluarga token
    if (stored.revoked_at) {
      await revokeFamily(stored.family_id);
      throw new AppError(
        401,
        "REFRESH_TOKEN_REUSED",
        "Sesi tidak valid, silakan login ulang",
      );
    }

    if (stored.expires_at < new Date()) {
      throw new AppError(
        401,
        "REFRESH_TOKEN_EXPIRED",
        "Sesi berakhir, silakan login ulang",
      );
    }

    const user = await authRepository.findById(stored.id_user);

    if (!user) {
      throw new AppError(401, "USER_NOT_FOUND", "Pengguna tidak ditemukan");
    }

    const platform = platformSchema.safeParse(stored.platform);

    if (!platform.success || !canAccess(user.role, platform.data)) {
      await revokeFamily(stored.family_id);
      throw new AppError(
        403,
        "PLATFORM_NOT_ALLOWED",
        "Akses tidak diizinkan dari platform ini",
      );
    }

    // Rotasi atomik: hanya satu request yang bisa mencabut token ini
    const revoked = await prisma.refreshToken.updateMany({
      where: { id_refresh: stored.id_refresh, revoked_at: null },
      data: { revoked_at: new Date() },
    });

    if (revoked.count === 0) {
      await revokeFamily(stored.family_id);
      throw new AppError(
        401,
        "REFRESH_TOKEN_REUSED",
        "Sesi tidak valid, silakan login ulang",
      );
    }

    const refresh_token = await issueRefresh(
      user.id_user,
      platform.data,
      stored.family_id,
    );

    return {
      token: signAccess(user, platform.data),
      refresh_token,
      user: toUserDto(user),
    };
  },

  async logout(rawToken: string) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token_hash: sha256(rawToken) },
    });

    if (stored) {
      await revokeFamily(stored.family_id);
    }
  },

  async me(id_user: string) {
    const user = await authRepository.findById(id_user);

    if (!user) {
      throw new AppError(401, "USER_NOT_FOUND", "Pengguna tidak ditemukan");
    }

    return toUserDto(user);
  },
};
