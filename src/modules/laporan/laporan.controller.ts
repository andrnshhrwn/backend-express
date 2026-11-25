import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../shared/errors/app-error";
import { success } from "../../shared/http/response";
import { laporanService } from "./laporan.service";
import {
  pengirimanQuerySchema,
  penugasanQuerySchema,
  penggantianQuerySchema,
} from "./laporan.validator";

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan");
  }
  return req.user;
}

export const laporanController = {
  async pengiriman(req: Request, res: Response, next: NextFunction) {
    try {
      const query = pengirimanQuerySchema.parse(req.query);
      const { data, meta } = await laporanService.pengiriman(
        requireUser(req),
        query,
      );
      success(res, 200, {
        message: "Laporan pengiriman WM berhasil diambil",
        data,
        meta,
      });
    } catch (error) {
      next(error);
    }
  },

  async penugasan(req: Request, res: Response, next: NextFunction) {
    try {
      const query = penugasanQuerySchema.parse(req.query);
      const { data, meta } = await laporanService.penugasan(
        requireUser(req),
        query,
      );
      success(res, 200, {
        message: "Laporan penugasan berhasil diambil",
        data,
        meta,
      });
    } catch (error) {
      next(error);
    }
  },

  async penggantian(req: Request, res: Response, next: NextFunction) {
    try {
      const query = penggantianQuerySchema.parse(req.query);
      const { data, meta } = await laporanService.penggantian(
        requireUser(req),
        query,
      );
      success(res, 200, {
        message: "Laporan penggantian WM berhasil diambil",
        data,
        meta,
      });
    } catch (error) {
      next(error);
    }
  },
};
