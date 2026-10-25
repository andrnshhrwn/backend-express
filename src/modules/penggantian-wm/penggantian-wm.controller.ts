import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../shared/errors/app-error";
import { success } from "../../shared/http/response";
import { penggantianWmService } from "./penggantian-wm.service";
import type {
  CreatePenggantianWmInput,
  ListPenggantianWmQuery,
} from "./penggantian-wm.validator";

export const penggantianWmController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const filters = res.locals.validatedQuery as ListPenggantianWmQuery;

      const result = await penggantianWmService.getAll(filters, req.user);

      return success(res, 200, {
        message: "Daftar BAP berhasil diambil.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const id = Number(req.params.id);
      const data = await penggantianWmService.getById(id, req.user);

      return success(res, 200, {
        message: "Detail BAP berhasil diambil.",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const input = req.body as CreatePenggantianWmInput;
      const data = await penggantianWmService.create(input, req.user.id_user);

      return success(res, 201, {
        message: "BAP berhasil dibuat dan menunggu validasi.",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
