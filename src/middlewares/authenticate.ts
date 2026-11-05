import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";
import { AppError } from "../shared/errors/app-error";

const uuidSchema = z.uuid();

const userRoleSchema = z.enum(["admin_pusat", "admin_cabang", "teknisi"]);

export interface AuthUser {
  id_user: string;
  role: "admin_pusat" | "admin_cabang" | "teknisi";
  id_unit: string | null;
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

    const validUnitId =
      decoded.id_unit === null
        ? true
        : uuidSchema.safeParse(decoded.id_unit).success;

    if (!validUserId.success || !validRole.success || !validUnitId) {
      return next(
        new AppError(401, "INVALID_TOKEN", "Token autentikasi tidak valid"),
      );
    }

    req.user = {
      id_user: validUserId.data,
      role: validRole.data,
      id_unit: decoded.id_unit as string | null,
    };

    next();
  } catch {
    next(
      new AppError(
        401,
        "INVALID_TOKEN",
        "Token tidak valid atau sudah kedaluwarsa",
      ),
    );
  }
}
