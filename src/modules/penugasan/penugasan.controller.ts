import type { Request, Response, NextFunction } from "express";
import { penugasanService } from "./penugasan.service";
import { success } from "../../shared/http/response";
import { AppError } from "../../shared/errors/app-error";

export const penugasanController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const data = await penugasanService.getAll(req.user);

      return success(res, 200, {
        message: "Data penugasan berhasil diambil.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const id = Number(req.params.id);
      const data = await penugasanService.getById(id, req.user);

      return success(res, 200, {
        message: "Detail penugasan berhasil diambil.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const data = await penugasanService.create(req.body, req.user);

      return success(res, 201, {
        message: "Penugasan berhasil dibuat.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const id = Number(req.params.id);
      const data = await penugasanService.update(id, req.body, req.user);

      return success(res, 200, {
        message: "Penugasan berhasil diperbarui.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const id = Number(req.params.id);
      await penugasanService.delete(id, req.user);

      return success(res, 200, {
        message: "Penugasan berhasil dihapus.",
        data: null,
      });
    } catch (error) {
      return next(error);
    }
  },
};
