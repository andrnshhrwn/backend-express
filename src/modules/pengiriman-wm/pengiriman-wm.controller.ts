
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../shared/errors/app-error";
import type { AuthUser } from "../../middlewares/authenticate";
import { pengirimanWmService } from "./pengiriman-wm.service";

function getAuthUser(req: Request): AuthUser {
  if (!req.user) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Pengguna belum terautentikasi",
    );
  }

  return req.user;
}

function getPengirimanId(req: Request): string {
  const id = req.params.id;

  if (typeof id !== "string") {
    throw new AppError(
      400,
      "INVALID_PENGIRIMAN_ID",
      "ID pengiriman tidak valid",
    );
  }

  return id;
}

export const pengirimanWmController = {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthUser(req);
      const data = await pengirimanWmService.findAll(user);

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
      const user = getAuthUser(req);
      const id_pengiriman = getPengirimanId(req);

      const data = await pengirimanWmService.findById(
        id_pengiriman,
        user,
      );

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
      const user = getAuthUser(req);
      const data = await pengirimanWmService.create(req.body, user);

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
      const user = getAuthUser(req);
      const id_pengiriman = getPengirimanId(req);

      const data = await pengirimanWmService.update(
        id_pengiriman,
        req.body,
        user,
      );

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
      const user = getAuthUser(req);
      const id_pengiriman = getPengirimanId(req);

      await pengirimanWmService.delete(id_pengiriman, user);

      res.status(200).json({
        status: "success",
        message: "Pengiriman WM berhasil dihapus",
      });
    } catch (error) {
      next(error);
    }
  },
};
