import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../shared/errors/app-error";
import { success } from "../../shared/http/response";
import { importPelangganService } from "./import-pelanggan.service";
import type { ConfirmImportPelangganInput } from "./import-pelanggan.validator";

export const importPelangganController = {
  preview: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError(
          400,
          "FILE_REQUIRED",
          "Pilih file Excel terlebih dahulu.",
        );
      }

      const data = await importPelangganService.preview(req.file.buffer);

      return success(res, 200, {
        message: "Preview import pelanggan berhasil dibuat.",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  confirm: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = req.body as ConfirmImportPelangganInput;
      const data = await importPelangganService.confirm(input);

      return success(res, 201, {
        message: "Import pelanggan berhasil.",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
