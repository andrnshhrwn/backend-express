import type { Request, Response, NextFunction } from "express";

import { AppError } from "../../shared/errors/app-error.js";
import { success } from "../../shared/http/response.js";

import { validasiService } from "./validasi.service.js";

import type { TolakBapInput, ValidasiQuery } from "./validasi.validator.js";

type ReadScope =
  | {
      id_user: string;
      role: "admin_pusat";
      id_unit: string | null;
    }
  | {
      id_user: string;
      role: "admin_cabang";
      id_unit: string;
    };

type AdminScope = {
  id_user: string;
  role: "admin_pusat";
  id_unit: string | null;
};

function getValidasiId(req: Request): string {
  const id = req.params.id;

  if (typeof id !== "string") {
    throw new AppError(400, "INVALID_VALIDASI_ID", "ID BAP tidak valid.");
  }

  return id;
}

function getReadActor(req: Request): ReadScope {
  if (!req.user) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "Anda tidak memiliki akses untuk melihat BAP.",
    );
  }

  if (req.user.role === "admin_pusat") {
    return {
      id_user: req.user.id_user,
      role: "admin_pusat",
      id_unit: req.user.id_unit,
    };
  }

  if (req.user.role === "admin_cabang") {
    if (!req.user.id_unit) {
      throw new AppError(
        403,
        "UNIT_NOT_ASSIGNED",
        "Akun Admin Cabang belum terhubung dengan unit.",
      );
    }

    return {
      id_user: req.user.id_user,
      role: "admin_cabang",
      id_unit: req.user.id_unit,
    };
  }

  throw new AppError(
    403,
    "FORBIDDEN",
    "Anda tidak memiliki akses untuk melihat BAP.",
  );
}

function getAdmin(req: Request): AdminScope {
  if (!req.user || req.user.role !== "admin_pusat") {
    throw new AppError(
      403,
      "FORBIDDEN",
      "Hanya Admin Pusat yang dapat memvalidasi BAP.",
    );
  }

  return {
    id_user: req.user.id_user,
    role: "admin_pusat",
    id_unit: req.user.id_unit,
  };
}

export const validasiController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = getReadActor(req);
      const filters = res.locals.validatedQuery as ValidasiQuery;

      const data = await validasiService.getAll(filters, actor);

      return success(res, 200, {
        message: "Daftar BAP berhasil diambil.",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = getReadActor(req);
      const id = getValidasiId(req);

      const data = await validasiService.getById(id, actor);

      return success(res, 200, {
        message: "Detail BAP berhasil diambil.",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async setujui(req: Request, res: Response, next: NextFunction) {
    try {
      const admin = getAdmin(req);
      const id = getValidasiId(req);

      const data = await validasiService.setujui(id, admin);

      return success(res, 200, {
        message: "BAP disetujui dan nomor seri WM aktif pelanggan diperbarui.",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async tolak(req: Request, res: Response, next: NextFunction) {
    try {
      const admin = getAdmin(req);
      const id = getValidasiId(req);
      const input = req.body as TolakBapInput;

      const data = await validasiService.tolak(id, input, admin);

      return success(res, 200, {
        message: "BAP ditolak. Catatan penolakan telah disimpan.",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
