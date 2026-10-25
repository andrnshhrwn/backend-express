import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../shared/errors/app-error";
import { pelangganService } from "./pelanggan.service";

function getPelangganId(req: Request): number {
  const id = req.params.id;

  if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
    throw new AppError(400, "INVALID_PELANGGAN_ID", "ID pelanggan tidak valid");
  }

  return Number(id);
}

export const pelangganController = {
  async findAll(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await pelangganService.findAll();

      res.status(200).json({
        success: true,
        message: "Daftar pelanggan berhasil diambil",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await pelangganService.findById(getPelangganId(req));

      res.status(200).json({
        success: true,
        message: "Detail pelanggan berhasil diambil",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pelangganService.create(req.body);

      res.status(201).json({
        success: true,
        message: "Pelanggan berhasil dibuat",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pelangganService.update(getPelangganId(req), req.body);

      res.status(200).json({
        success: true,
        message: "Pelanggan berhasil diperbarui",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pelangganService.delete(getPelangganId(req));

      res.status(200).json({
        success: true,
        message: "Pelanggan berhasil dihapus",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
