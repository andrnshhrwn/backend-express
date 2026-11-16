import type { Request, Response, NextFunction } from "express";

import { AppError } from "../../shared/errors/app-error";
import { success } from "../../shared/http/response";

import { penggantianWmService } from "./penggantian-wm.service";

import type {
  SubmitDataWmLamaInput,
  SelesaikanPenggantianWmInput,
  PerbaikiPenggantianWmInput,
  ListPenggantianWmQuery,
} from "./penggantian-wm.validator";

function getParamId(req: Request, key: string, message: string): string {
  const id = req.params[key];

  if (typeof id !== "string") {
    throw new AppError(400, "INVALID_ID", message);
  }

  return id;
}

function getUploadedFiles(req: Request) {
  const files = req.files;

  if (!files || Array.isArray(files)) {
    return {
      fotoWmLama: undefined,
      fotoWmBaru: undefined,
    };
  }

  return {
    fotoWmLama: files.foto_wm_lama?.[0],
    fotoWmBaru: files.foto_wm_baru?.[0],
  };
}

function hasPerbaikanData(input: PerbaikiPenggantianWmInput): boolean {
  return Object.values(input).some((value) => value !== undefined);
}

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

  async getStok(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const result = await penggantianWmService.getStok(req.user);

      return success(res, 200, {
        message: "Ringkasan stok WM berhasil diambil.",
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

      const id = getParamId(req, "id", "ID BAP tidak valid.");

      const data = await penggantianWmService.getById(id, req.user);

      return success(res, 200, {
        message: "Detail BAP berhasil diambil.",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  // TAHAP 1: DATA WM LAMA
  async submitDataWmLama(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const idPenugasan = getParamId(
        req,
        "id_penugasan",
        "ID penugasan tidak valid.",
      );

      const fotoWmLama = req.file;

      if (!fotoWmLama) {
        throw new AppError(
          400,
          "FOTO_WM_LAMA_REQUIRED",
          "Foto WM lama wajib diunggah.",
        );
      }

      const input = req.body as SubmitDataWmLamaInput;

      const pathImageWmLama = `/uploads/penggantian-wm/${fotoWmLama.filename}`;

      const data = await penggantianWmService.submitDataWmLama(
        idPenugasan,
        input,
        pathImageWmLama,
        req.user.id_user,
      );

      return success(res, 201, {
        message:
          "Data WM lama berhasil dikonfirmasi. SPK berubah menjadi proses.",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  // TAHAP 2: SELESAIKAN PEMASANGAN WM BARU
  async selesaikan(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const idPenggantian = getParamId(req, "id", "ID BAP tidak valid.");

      const fotoWmBaru = req.file;

      if (!fotoWmBaru) {
        throw new AppError(
          400,
          "FOTO_WM_BARU_REQUIRED",
          "Foto WM baru wajib diunggah.",
        );
      }

      const input = req.body as SelesaikanPenggantianWmInput;

      const pathImageWmBaru = `/uploads/penggantian-wm/${fotoWmBaru.filename}`;

      const data = await penggantianWmService.selesaikan(
        idPenggantian,
        input,
        pathImageWmBaru,
        req.user.id_user,
      );

      return success(res, 200, {
        message:
          "Pekerjaan berhasil diselesaikan. BAP menunggu validasi Admin Pusat.",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  // PERBAIKAN DAN PENGAJUAN ULANG BAP
  async perbaiki(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const idPenggantian = getParamId(req, "id", "ID BAP tidak valid.");

      const { fotoWmLama, fotoWmBaru } = getUploadedFiles(req);

      const input = req.body as PerbaikiPenggantianWmInput;

      if (!hasPerbaikanData(input) && !fotoWmLama && !fotoWmBaru) {
        throw new AppError(
          400,
          "PERBAIKAN_KOSONG",
          "Kirim minimal satu perubahan data atau foto untuk memperbaiki BAP.",
        );
      }

      const pathImageWmLama = fotoWmLama
        ? `/uploads/penggantian-wm/${fotoWmLama.filename}`
        : undefined;

      const pathImageWmBaru = fotoWmBaru
        ? `/uploads/penggantian-wm/${fotoWmBaru.filename}`
        : undefined;

      const data = await penggantianWmService.perbaiki(
        idPenggantian,
        input,
        pathImageWmLama,
        pathImageWmBaru,
        req.user.id_user,
      );

      return success(res, 200, {
        message:
          "Perbaikan BAP berhasil disimpan dan diajukan kembali untuk validasi Admin Pusat.",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
