import type { Request, Response, NextFunction } from "express";
import { unitService } from "./unit.service";

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
      const data = await unitService.findById(Number(req.params.id));

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
      const data = await unitService.create(req.body.nama_unit);

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
        Number(req.params.id),
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
      const data = await unitService.delete(Number(req.params.id));

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
