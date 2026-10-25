import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../shared/errors/app-error";
import { success } from "../../shared/http/response";
import { validasiService } from "./validasi.service";
import type { TolakBapInput, ValidasiQuery } from "./validasi.validator";

function getAdmin(req: Request) {
  if (
    !req.user ||
    (req.user.role !== "admin_pusat" && req.user.role !== "admin_cabang")
  ) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "Hanya admin yang dapat memvalidasi BAP.",
    );
  }

  return {
    id_user: req.user.id_user,
    role: req.user.role,
    id_unit: req.user.id_unit,
  };
}

export const validasiController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const admin = getAdmin(req);
      const filters = res.locals.validatedQuery as ValidasiQuery;
      const data = await validasiService.getAll(filters, admin);

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
      const admin = getAdmin(req);
      const id = Number(req.params.id);
      const data = await validasiService.getById(id, admin);

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
      const id = Number(req.params.id);
      const data = await validasiService.setujui(id, admin);

      return success(res, 200, {
        message:
          "BAP disetujui. Nomor seri WM pelanggan dan status SPK telah diperbarui.",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async tolak(req: Request, res: Response, next: NextFunction) {
    try {
      const admin = getAdmin(req);
      const id = Number(req.params.id);
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
