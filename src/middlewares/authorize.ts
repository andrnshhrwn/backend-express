import type { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/errors/app-error";
import type { AuthUser } from "./authenticate";

export function authorize(...allowedRoles: AuthUser["role"][]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          403,
          "FORBIDDEN",
          "Kamu tidak memiliki akses ke resource ini",
        ),
      );
    }

    next();
  };
}
