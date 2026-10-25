import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../shared/errors/app-error";
import { userService } from "./user.service";

function getUserId(req: Request): number {
  const id = req.params.id;

  if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
    throw new AppError(400, "INVALID_USER_ID", "ID pengguna tidak valid");
  }

  return Number(id);
}

export const userController = {
  async findAll(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await userService.findAll();

      res.status(200).json({
        success: true,
        message: "Daftar pengguna berhasil diambil",
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
      const data = await userService.findById(getUserId(req));

      res.status(200).json({
        success: true,
        message: "Detail pengguna berhasil diambil",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await userService.create(req.body);

      res.status(201).json({
        success: true,
        message: "Pengguna berhasil dibuat",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await userService.update(getUserId(req), req.body);

      res.status(200).json({
        success: true,
        message: "Pengguna berhasil diperbarui",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
