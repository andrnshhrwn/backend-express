import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import { unitService } from "./unit.service.js";

function getUnitId(req: Request): string {
  const id = req.params.id;

  if (typeof id !== "string") {
    throw new AppError(400, "INVALID_UNIT_ID", "ID unit tidak valid");
  }

  return id;
}

export const unitController = {
  async findAll(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await unitService.findAll();

      res.status(200).json({
        success: true,
        message: "Daftar unit berhasil diambil",
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
      const data = await unitService.findById(getUnitId(req));

      res.status(200).json({
        success: true,
        message: "Detail unit berhasil diambil",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await unitService.create(
        req.body.kode_unit,
        req.body.nama_unit,
      );

      res.status(201).json({
        success: true,
        message: "Unit berhasil dibuat",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await unitService.update(
        getUnitId(req),
        req.body.kode_unit,
        req.body.nama_unit,
      );

      res.status(200).json({
        success: true,
        message: "Unit berhasil diperbarui",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await unitService.delete(getUnitId(req));

      res.status(200).json({
        success: true,
        message: "Unit berhasil dihapus",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
