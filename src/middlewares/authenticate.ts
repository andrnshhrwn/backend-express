import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";
import { AppError } from "../shared/errors/app-error";
import { canAccess } from "../config/accessPolicy";

const uuidSchema = z.uuid();
const userRoleSchema = z.enum([
  "admin_pusat",
  "admin_cabang",
  "teknisi",
  "pimpinan",
]);
const platformSchema = z.enum(["web", "android"]);

export interface AuthUser {
  id_user: string;
  role: "admin_pusat" | "admin_cabang" | "teknisi" | "pimpinan";
  id_unit: string | null;
  platform: "web" | "android";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return next(
      new AppError(401, "UNAUTHORIZED", "Token autentikasi tidak ditemukan"),
    );
  }

  const token = authorization.slice(7);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (typeof decoded === "string") {
      return next(
        new AppError(401, "INVALID_TOKEN", "Token autentikasi tidak valid"),
      );
    }

    const validUserId = uuidSchema.safeParse(decoded.id_user);
    const validRole = userRoleSchema.safeParse(decoded.role);
    const validPlatform = platformSchema.safeParse(decoded.platform);

    const validUnitId =
      decoded.id_unit === null
        ? true
        : uuidSchema.safeParse(decoded.id_unit).success;

    if (
      !validUserId.success ||
      !validRole.success ||
      !validPlatform.success ||
      !validUnitId
    ) {
      return next(
        new AppError(401, "INVALID_TOKEN", "Token autentikasi tidak valid"),
      );
    }

    if (!canAccess(validRole.data, validPlatform.data)) {
      return next(
        new AppError(403, "PLATFORM_NOT_ALLOWED", "Akses tidak diizinkan"),
      );
    }

    req.user = {
      id_user: validUserId.data,
      role: validRole.data,
      id_unit: decoded.id_unit as string | null,
      platform: validPlatform.data,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(
        new AppError(401, "TOKEN_EXPIRED", "Token sudah kedaluwarsa"),
      );
    }

    next(new AppError(401, "INVALID_TOKEN", "Token autentikasi tidak valid"));
  }
}
