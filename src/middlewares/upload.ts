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

// import multer from "multer";
// import path from "node:path";
// import { randomUUID } from "node:crypto";

// import type { RequestHandler } from "express";
// import { createClient } from "@supabase/supabase-js";

// import { env } from "../config/env.js";
// import { AppError } from "../shared/errors/app-error";

// // =====================================================
// // KONFIGURASI SUPABASE STORAGE CLIENT
// // =====================================================

// const supabaseStorageClient = createClient(
//   env.SUPABASE_URL,
//   env.SUPABASE_SERVICE_ROLE_KEY,
//   {
//     auth: {
//       persistSession: false,
//       autoRefreshToken: false,
//     },
//   },
// );

// const allowedImageTypes: Record<string, string> = {
//   ".jpg": "image/jpeg",
//   ".jpeg": "image/jpeg",
//   ".png": "image/png",
//   ".webp": "image/webp",
// };

// // =====================================================
// // UPLOAD EXCEL PELANGGAN
// // =====================================================

// const uploadExcel = multer({
//   storage: multer.memoryStorage(),

//   limits: {
//     fileSize: 5 * 1024 * 1024,
//     files: 1,
//   },

//   fileFilter: (_req, file, callback) => {
//     const ext = path.extname(file.originalname).toLowerCase();

//     if (![".xlsx", ".xls"].includes(ext)) {
//       callback(
//         new AppError(
//           400,
//           "INVALID_FILE_TYPE",
//           "File harus berformat .xlsx atau .xls.",
//         ),
//       );
//       return;
//     }

//     callback(null, true);
//   },
// });

// export const uploadPelangganExcel = uploadExcel.single("file");

// // =====================================================
// // UPLOAD FOTO PENGGANTIAN WM (BAP) - MEMORY STORAGE
// // =====================================================

// const uploadFotoWmMemory = multer({
//   storage: multer.memoryStorage(),

//   limits: {
//     fileSize: env.MAX_FILE_SIZE,
//     files: 2,
//   },

//   fileFilter: (_req, file, callback) => {
//     const ext = path.extname(file.originalname).toLowerCase();
//     const expectedMimeType = allowedImageTypes[ext];

//     if (!expectedMimeType || file.mimetype !== expectedMimeType) {
//       callback(
//         new AppError(
//           400,
//           "INVALID_IMAGE_TYPE",
//           "Foto harus berformat JPG, JPEG, PNG, atau WebP.",
//         ),
//       );
//       return;
//     }

//     callback(null, true);
//   },
// });

// // Tahap pertama: upload foto WM lama.
// export const uploadFotoWmLama = uploadFotoWmMemory.single("foto_wm_lama");

// // Tahap kedua: upload foto WM baru.
// export const uploadFotoWmBaru = uploadFotoWmMemory.single("foto_wm_baru");

// // Perbaikan BAP: kedua foto bersifat opsional.
// // Maksimal satu foto untuk setiap field.
// export const uploadFotoPerbaikanBap = uploadFotoWmMemory.fields([
//   {
//     name: "foto_wm_lama",
//     maxCount: 1,
//   },
//   {
//     name: "foto_wm_baru",
//     maxCount: 1,
//   },
// ]);

// // =====================================================
// // HELPER UPLOAD & CLEANUP SUPABASE STORAGE
// // =====================================================

// export interface UploadedStorageFile {
//   path: string;
//   publicUrl: string | null;
//   contentType: string;
//   size: number;
// }

// export function getSupabasePublicUrl(objectPath: string): string | null {
//   const cleanPath = objectPath.replace(/^\/+/, "");
//   if (!cleanPath) return null;

//   const { data } = supabaseStorageClient.storage
//     .from(env.SUPABASE_STORAGE_BUCKET)
//     .getPublicUrl(cleanPath);

//   return data.publicUrl || null;
// }

// export async function uploadFotoWmToSupabase(
//   file: Express.Multer.File,
//   folder = "penggantian-wm",
// ): Promise<UploadedStorageFile> {
//   if (!file.buffer || file.buffer.length === 0) {
//     throw new AppError(
//       400,
//       "EMPTY_FILE_BUFFER",
//       "Konten file foto tidak ditemukan di memori.",
//     );
//   }

//   const ext = path.extname(file.originalname).toLowerCase();
//   const contentType = allowedImageTypes[ext] ?? file.mimetype;
//   const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
//   const objectPath = `${cleanFolder}/${randomUUID()}${ext}`;

//   const { error } = await supabaseStorageClient.storage
//     .from(env.SUPABASE_STORAGE_BUCKET)
//     .upload(objectPath, file.buffer, {
//       contentType,
//       upsert: false,
//     });

//   if (error) {
//     throw new AppError(
//       500,
//       "SUPABASE_UPLOAD_FAILED",
//       "Gagal mengunggah foto ke Supabase Storage.",
//     );
//   }

//   return {
//     path: objectPath,
//     publicUrl: getSupabasePublicUrl(objectPath),
//     contentType,
//     size: file.size,
//   };
// }

// export async function deleteObjectsFromSupabase(
//   objectPaths: string[],
// ): Promise<void> {
//   const uniquePaths = [...new Set(objectPaths.filter((p) => Boolean(p)))];
//   if (uniquePaths.length === 0) return;

//   await supabaseStorageClient.storage
//     .from(env.SUPABASE_STORAGE_BUCKET)
//     .remove(uniquePaths)
//     .catch(() => undefined);
// }

// // Middleware opsional jika ingin langsung mengunggah req.file / req.files
// // ke Supabase Storage dan menaruh hasilnya di req.uploadedStorageFiles.
// export const attachUploadedStorageFiles: RequestHandler = async (
//   req,
//   _res,
//   next,
// ) => {
//   try {
//     const files: Express.Multer.File[] = [];

//     if (req.file) {
//       files.push(req.file);
//     }

//     if (req.files) {
//       if (Array.isArray(req.files)) {
//         files.push(...req.files);
//       } else {
//         files.push(...Object.values(req.files).flat());
//       }
//     }

//     if (files.length === 0) {
//       return next();
//     }

//     const uploaded = await Promise.all(
//       files.map((file) => uploadFotoWmToSupabase(file, "penggantian-wm")),
//     );

//     (
//       req as typeof req & { uploadedStorageFiles?: UploadedStorageFile[] }
//     ).uploadedStorageFiles = uploaded;

//     next();
//   } catch (error) {
//     next(error);
//   }
// };
