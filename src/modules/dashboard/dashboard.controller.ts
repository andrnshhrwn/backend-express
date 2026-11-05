import type { Request, Response, NextFunction } from "express";
import { dashboardService } from "./dashboard.service";
import { success } from "../../shared/http/response";
import { AppError } from "../../shared/errors/app-error";

export const dashboardController = {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const periode =
        typeof req.query.periode === "string" ? req.query.periode : undefined;

      const data = await dashboardService.getSummary(req.user, periode);

      return success(res, 200, {
        message: "Ringkasan dashboard berhasil diambil.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getUnitProgress(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const periode =
        typeof req.query.periode === "string" ? req.query.periode : undefined;

      const data = await dashboardService.getUnitProgress(req.user, periode);

      return success(res, 200, {
        message: "Progres unit berhasil diambil.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },
};
