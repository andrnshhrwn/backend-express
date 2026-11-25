import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";

import type { ErrorRequestHandler } from "express";

import { env } from "../config/env.js";
import { AppError } from "../shared/errors/app-error";

// =====================================================
// UPLOAD EXCEL PELANGGAN
// =====================================================

const uploadExcel = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (![".xlsx", ".xls"].includes(ext)) {
      callback(
        new AppError(
          400,
          "INVALID_FILE_TYPE",
          "File harus berformat .xlsx atau .xls.",
        ),
      );
      return;
    }

    callback(null, true);
  },
});

export const uploadPelangganExcel = uploadExcel.single("file");

// =====================================================
// UPLOAD FOTO PENGGANTIAN WM (BAP)
// =====================================================

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR, "penggantian-wm");

const allowedImageTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const uploadFotoWm = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
        callback(null, uploadDir);
      } catch {
        callback(
          new AppError(
            500,
            "UPLOAD_DIRECTORY_ERROR",
            "Gagal menyiapkan direktori penyimpanan foto.",
          ),
          uploadDir,
        );
      }
    },

    filename: (_req, file, callback) => {
      const ext = path.extname(file.originalname).toLowerCase();
      callback(null, `${randomUUID()}${ext}`);
    },
  }),

  limits: {
    fileSize: env.MAX_FILE_SIZE,
    files: 2,
  },

  fileFilter: (_req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const expectedMimeType = allowedImageTypes[ext];

    if (!expectedMimeType || file.mimetype !== expectedMimeType) {
      callback(
        new AppError(
          400,
          "INVALID_IMAGE_TYPE",
          "Foto harus berformat JPG, JPEG, PNG, atau WebP.",
        ),
      );
      return;
    }

    callback(null, true);
  },
});

// Tahap pertama: upload foto WM lama.
export const uploadFotoWmLama = uploadFotoWm.single("foto_wm_lama");

// Tahap kedua: upload foto WM baru.
export const uploadFotoWmBaru = uploadFotoWm.single("foto_wm_baru");

// Perbaikan BAP: kedua foto bersifat opsional.
// Maksimal satu foto untuk setiap field.
export const uploadFotoPerbaikanBap = uploadFotoWm.fields([
  {
    name: "foto_wm_lama",
    maxCount: 1,
  },
  {
    name: "foto_wm_baru",
    maxCount: 1,
  },
]);

// =====================================================
// CLEANUP FILE JIKA REQUEST BAP GAGAL
// =====================================================

export const cleanupPenggantianWmFilesOnError: ErrorRequestHandler = (
  error,
  req,
  _res,
  next,
) => {
  const uploadedFiles: Express.Multer.File[] = [];

  if (req.file) {
    uploadedFiles.push(req.file);
  }

  if (req.files) {
    if (Array.isArray(req.files)) {
      uploadedFiles.push(...req.files);
    } else {
      uploadedFiles.push(...Object.values(req.files).flat());
    }
  }

  const uniquePaths = [
    ...new Set(
      uploadedFiles
        .map((file) => file.path)
        .filter((filePath): filePath is string => Boolean(filePath)),
    ),
  ];

  void Promise.all(
    uniquePaths.map((filePath) => unlink(filePath).catch(() => undefined)),
  ).then(() => next(error));
};
