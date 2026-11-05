import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../shared/errors/app-error";
import { merkWmService } from "./merk-wm.service";

function getMerkWmId(req: Request): string {
  const id = req.params.id;

  if (typeof id !== "string") {
    throw new AppError(400, "INVALID_MERK_WM_ID", "ID merek WM tidak valid");
  }

  return id;
}

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
      const data = await merkWmService.findById(getMerkWmId(req));

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
      const data = await merkWmService.update(getMerkWmId(req), req.body);

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
      const data = await merkWmService.delete(getMerkWmId(req));

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
