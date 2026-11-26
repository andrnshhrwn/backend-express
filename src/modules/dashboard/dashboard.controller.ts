import type { Request, Response, NextFunction } from "express";
import { dashboardService } from "./dashboard.service.js";
import { success } from "../../shared/http/response.js";
import { AppError } from "../../shared/errors/app-error.js";

function getQueryString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export const dashboardController = {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const periode = getQueryString(req.query.periode);
      const idUnit = getQueryString(req.query.id_unit);

      const data = await dashboardService.getSummary(req.user, periode, idUnit);

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

      const periode = getQueryString(req.query.periode);
      const idUnit = getQueryString(req.query.id_unit);

      const data = await dashboardService.getUnitProgress(
        req.user,
        periode,
        idUnit,
      );

      return success(res, 200, {
        message: "Progres unit berhasil diambil.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },
};
