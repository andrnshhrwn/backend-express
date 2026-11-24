import type { Request, Response, NextFunction } from "express";

import { AppError } from "../../shared/errors/app-error";
import { success } from "../../shared/http/response";

import {
  deleteObjectsFromSupabase,
  type UploadedStorageFile,
} from "../../middlewares/upload";

import { penggantianWmService } from "./penggantian-wm.service";

import type {
  SubmitDataWmLamaInput,
  SelesaikanPenggantianWmInput,
  PerbaikiPenggantianWmInput,
  ListPenggantianWmQuery,
} from "./penggantian-wm.validator";

type RequestWithUploadedStorageFiles = Request & {
  uploadedStorageFiles?: UploadedStorageFile[];
};

function getParamId(req: Request, key: string, message: string): string {
  const id = req.params[key];

  if (typeof id !== "string") {
    throw new AppError(400, "INVALID_ID", message);
  }

  return id;
}

function getUploadedStorageFiles(req: Request) {
  const files =
    (req as RequestWithUploadedStorageFiles).uploadedStorageFiles ?? [];

  return {
    fotoWmLama: files.find((file) => file.fieldname === "foto_wm_lama"),
    fotoWmBaru: files.find((file) => file.fieldname === "foto_wm_baru"),
  };
}

function hasPerbaikanData(input: PerbaikiPenggantianWmInput): boolean {
  return Object.values(input).some((value) => value !== undefined);
}

async function cleanupUploadedFiles(
  files: UploadedStorageFile[],
): Promise<void> {
  await deleteObjectsFromSupabase(files.map((file) => file.path));
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
      return next(error);
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
      return next(error);
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
      return next(error);
    }
  },

  // ===================================================
  // TAHAP 1: DATA WM LAMA
  // ===================================================

  async submitDataWmLama(req: Request, res: Response, next: NextFunction) {
    const uploadedFiles =
      (req as RequestWithUploadedStorageFiles).uploadedStorageFiles ?? [];

    let databaseSaved = false;

    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const idPenugasan = getParamId(
        req,
        "id_penugasan",
        "ID penugasan tidak valid.",
      );

      const { fotoWmLama } = getUploadedStorageFiles(req);

      if (!fotoWmLama) {
        throw new AppError(
          400,
          "FOTO_WM_LAMA_REQUIRED",
          "Foto WM lama wajib diunggah.",
        );
      }

      const input = req.body as SubmitDataWmLamaInput;

      const data = await penggantianWmService.submitDataWmLama(
        idPenugasan,
        input,
        fotoWmLama.path,
        req.user.id_user,
      );

      databaseSaved = true;

      // Ambil ulang detail agar status SPK yang dikirim
      // merupakan status terbaru setelah transaksi.
      const refreshedData = await penggantianWmService.getById(
        data.id_penggantian,
        req.user,
      );

      return success(res, 201, {
        message:
          "Data WM lama berhasil dikonfirmasi. SPK berubah menjadi proses.",
        data: refreshedData,
      });
    } catch (error) {
      if (!databaseSaved) {
        await cleanupUploadedFiles(uploadedFiles);
      }
      return next(error);
    }
  },

  // ===================================================
  // TAHAP 2: SELESAIKAN PEMASANGAN WM BARU
  // ===================================================

  async selesaikan(req: Request, res: Response, next: NextFunction) {
    const uploadedFiles =
      (req as RequestWithUploadedStorageFiles).uploadedStorageFiles ?? [];

    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const idPenggantian = getParamId(req, "id", "ID BAP tidak valid.");

      const { fotoWmBaru } = getUploadedStorageFiles(req);

      if (!fotoWmBaru) {
        throw new AppError(
          400,
          "FOTO_WM_BARU_REQUIRED",
          "Foto WM baru wajib diunggah.",
        );
      }

      const input = req.body as SelesaikanPenggantianWmInput;

      const data = await penggantianWmService.selesaikan(
        idPenggantian,
        input,
        fotoWmBaru.path,
        req.user.id_user,
      );

      const refreshedData = await penggantianWmService.getById(
        data.id_penggantian,
        req.user,
      );

      return success(res, 200, {
        message:
          "Pekerjaan berhasil diselesaikan. BAP menunggu validasi Admin Pusat.",
        data: refreshedData,
      });
    } catch (error) {
      await cleanupUploadedFiles(uploadedFiles);
      return next(error);
    }
  },

  // ===================================================
  // PERBAIKAN DAN PENGAJUAN ULANG BAP
  // ===================================================

  async perbaiki(req: Request, res: Response, next: NextFunction) {
    const uploadedFiles =
      (req as RequestWithUploadedStorageFiles).uploadedStorageFiles ?? [];

    try {
      if (!req.user) {
        throw new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan.");
      }

      const idPenggantian = getParamId(req, "id", "ID BAP tidak valid.");

      const { fotoWmLama, fotoWmBaru } = getUploadedStorageFiles(req);

      const input = req.body as PerbaikiPenggantianWmInput;

      if (!hasPerbaikanData(input) && !fotoWmLama && !fotoWmBaru) {
        throw new AppError(
          400,
          "PERBAIKAN_KOSONG",
          "Kirim minimal satu perubahan data atau foto untuk memperbaiki BAP.",
        );
      }

      const data = await penggantianWmService.perbaiki(
        idPenggantian,
        input,
        fotoWmLama?.path,
        fotoWmBaru?.path,
        req.user.id_user,
      );

      return success(res, 200, {
        message:
          "Perbaikan BAP berhasil disimpan dan diajukan kembali untuk validasi Admin Pusat.",
        data,
      });
    } catch (error) {
      await cleanupUploadedFiles(uploadedFiles);
      return next(error);
    }
  },
};
