import type { Request, Response, NextFunction } from "express";
import { penugasanService } from "./penugasan.service.js";
import { success } from "../../shared/http/response.js";
import { AppError } from "../../shared/errors/app-error.js";

function getPenugasanId(req: Request): string {
  const id = req.params.id;

  if (typeof id !== "string") {
    throw new AppError(
      400,
      "INVALID_PENUGASAN_ID",
      "ID penugasan tidak valid.",
    );
  }

  return id;
}

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

      const id = getPenugasanId(req);
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

  async assignTeknisi(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const id = getPenugasanId(req);

      const data = await penugasanService.assignTeknisi(
        id,
        req.body.id_teknisi,
        req.user,
      );

      return success(res, 200, {
        message: "Teknisi berhasil ditetapkan.",
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

      const id = getPenugasanId(req);
      const data = await penugasanService.update(id, req.body, req.user);

      return success(res, 200, {
        message: "Penugasan berhasil diperbarui.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const id = getPenugasanId(req);
      const data = await penugasanService.cancel(id, req.user);

      return success(res, 200, {
        message: "SPK berhasil dibatalkan.",
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

      const id = getPenugasanId(req);

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
