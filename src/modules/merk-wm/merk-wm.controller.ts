import type { Request, Response, NextFunction } from "express";
import { merkWmService } from "./merk-wm.service";

export const merkWmController = {
  async findAll(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await merkWmService.findAll();
      res.status(200).json({
        success: true,
        message: "Daftar merek WM berhasil diambil",
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
      const data = await merkWmService.findById(Number(req.params.id));
      res.status(200).json({
        success: true,
        message: "Detail merek WM berhasil diambil",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await merkWmService.create(req.body);
      res.status(201).json({
        success: true,
        message: "Merek WM berhasil dibuat",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await merkWmService.update(Number(req.params.id), req.body);
      res.status(200).json({
        success: true,
        message: "Merek WM berhasil diperbarui",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await merkWmService.delete(Number(req.params.id));

      res.status(200).json({
        success: true,
        message: "Merek WM berhasil dihapus",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
