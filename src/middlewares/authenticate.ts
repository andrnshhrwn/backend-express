import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../shared/errors/app-error";

export interface AuthUser {
  id_user: number;
  role: "admin_pusat" | "admin_cabang" | "teknisi";
  id_unit: number | null;
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

    if (
      typeof decoded === "string" ||
      typeof decoded.id_user !== "number" ||
      !["admin_pusat", "admin_cabang", "teknisi"].includes(
        String(decoded.role),
      ) ||
      !(decoded.id_unit === null || typeof decoded.id_unit === "number")
    ) {
      return next(
        new AppError(401, "INVALID_TOKEN", "Token autentikasi tidak valid"),
      );
    }

    req.user = {
      id_user: decoded.id_user,
      role: decoded.role as AuthUser["role"],
      id_unit: decoded.id_unit,
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
