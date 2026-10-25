import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../shared/errors/app-error";
import { pengirimanWmService } from "./pengiriman-wm.service";

function getUserId(req: Request): number {
  const id_user = req.user?.id_user;

  if (!id_user || !Number.isInteger(id_user) || id_user <= 0) {
    throw new AppError(401, "UNAUTHORIZED", "Pengguna belum terautentikasi");
  }

  return id_user;
}

export const pengirimanWmController = {
  async findAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await pengirimanWmService.findAll();

      res.status(200).json({
        status: "success",
        message: "Daftar pengiriman WM berhasil diambil",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const id_pengiriman = Number(req.params.id);
      const data = await pengirimanWmService.findById(id_pengiriman);

      res.status(200).json({
        status: "success",
        message: "Detail pengiriman WM berhasil diambil",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const id_user_pusat = getUserId(req);
      const data = await pengirimanWmService.create(req.body, id_user_pusat);

      res.status(201).json({
        status: "success",
        message: "Pengiriman WM berhasil dibuat",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id_pengiriman = Number(req.params.id);
      const data = await pengirimanWmService.update(id_pengiriman, req.body);

      res.status(200).json({
        status: "success",
        message: "Pengiriman WM berhasil diperbarui",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id_pengiriman = Number(req.params.id);
      await pengirimanWmService.delete(id_pengiriman);

      res.status(200).json({
        status: "success",
        message: "Pengiriman WM berhasil dihapus",
      });
    } catch (error) {
      next(error);
    }
  },
};
