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

function sendExcel(res: Response, file: { buffer: Buffer; fileName: string }) {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${file.fileName}"`,
  );

  res.setHeader("Content-Length", file.buffer.length);

  return res.status(200).send(file.buffer);
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

  async exportPengiriman(req: Request, res: Response, next: NextFunction) {
    try {
      const query = pengirimanQuerySchema.parse(req.query);

      const file = await laporanService.exportPengiriman(
        requireUser(req),
        query,
      );

      sendExcel(res, file);
    } catch (error) {
      next(error);
    }
  },

  async exportPenugasan(req: Request, res: Response, next: NextFunction) {
    try {
      const query = penugasanQuerySchema.parse(req.query);

      const file = await laporanService.exportPenugasan(
        requireUser(req),
        query,
      );

      sendExcel(res, file);
    } catch (error) {
      next(error);
    }
  },

  async exportPenggantian(req: Request, res: Response, next: NextFunction) {
    try {
      const query = penggantianQuerySchema.parse(req.query);

      const file = await laporanService.exportPenggantian(
        requireUser(req),
        query,
      );

      sendExcel(res, file);
    } catch (error) {
      next(error);
    }
  },
};