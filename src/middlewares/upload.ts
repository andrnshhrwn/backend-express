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

import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

import { env } from "../config/env.js";
import { AppError } from "../shared/errors/app-error";

// =====================================================
// SUPABASE STORAGE CLIENT
// =====================================================

const supabaseStorageClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

const allowedImageTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

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
// MULTER FOTO WM
// =====================================================

const uploadFotoWmMemory = multer({
  storage: multer.memoryStorage(),
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

export const uploadFotoWmLama = uploadFotoWmMemory.single("foto_wm_lama");

export const uploadFotoWmBaru = uploadFotoWmMemory.single("foto_wm_baru");

export const uploadFotoPerbaikanBap = uploadFotoWmMemory.fields([
  { name: "foto_wm_lama", maxCount: 1 },
  { name: "foto_wm_baru", maxCount: 1 },
]);

// =====================================================
// TIPE FILE STORAGE
// =====================================================

export interface UploadedStorageFile {
  fieldname: string;
  path: string;
  publicUrl: string | null;
  contentType: string;
  size: number;
}

type RequestWithUploadedStorageFiles = Express.Request & {
  uploadedStorageFiles?: UploadedStorageFile[];
};

// =====================================================
// PUBLIC URL
// =====================================================

export function getSupabasePublicUrl(objectPath: string): string | null {
  const cleanPath = objectPath.replace(/^\/+/, "");

  if (!cleanPath) {
    return null;
  }

  const { data } = supabaseStorageClient.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(cleanPath);

  return data.publicUrl || null;
}

// =====================================================
// UPLOAD KE SUPABASE
// =====================================================

export async function uploadFotoWmToSupabase(
  file: Express.Multer.File,
  folder = "penggantian-wm",
): Promise<UploadedStorageFile> {
  if (!file.buffer || file.buffer.length === 0) {
    throw new AppError(
      400,
      "EMPTY_FILE_BUFFER",
      "Konten file foto tidak ditemukan di memori.",
    );
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const contentType = allowedImageTypes[ext];

  if (!contentType || file.mimetype !== contentType) {
    throw new AppError(400, "INVALID_IMAGE_TYPE", "Format foto tidak valid.");
  }

  const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
  const objectPath = `${cleanFolder}/${randomUUID()}${ext}`;

  const { error } = await supabaseStorageClient.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(objectPath, file.buffer, {
      contentType,
      upsert: false,
    });

  // if (error) {
  //   console.error("Supabase upload error:", error.message);

  //   throw new AppError(
  //     500,
  //     "SUPABASE_UPLOAD_FAILED",
  //     "Gagal mengunggah foto ke Supabase Storage.",
  //   );
  // }

  if (error) {
    const supabaseUrl = new URL(env.SUPABASE_URL);

    console.error("Supabase upload diagnostic:", {
      supabaseHost: supabaseUrl.host,
      supabasePathname: supabaseUrl.pathname,
      bucket: env.SUPABASE_STORAGE_BUCKET,
      objectPath,
      errorMessage: error.message,
    });

    throw new AppError(
      500,
      "SUPABASE_UPLOAD_FAILED",
      "Gagal mengunggah foto ke Supabase Storage.",
    );
  }

  return {
    fieldname: file.fieldname,
    path: objectPath,
    publicUrl: getSupabasePublicUrl(objectPath),
    contentType,
    size: file.size,
  };
}

// =====================================================
// HAPUS OBJECT DARI SUPABASE
// =====================================================

export async function deleteObjectsFromSupabase(
  objectPaths: string[],
): Promise<void> {
  const uniquePaths = [
    ...new Set(
      objectPaths.map((item) => item.replace(/^\/+/, "")).filter(Boolean),
    ),
  ];

  if (uniquePaths.length === 0) {
    return;
  }

  const { error } = await supabaseStorageClient.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .remove(uniquePaths);

  if (error) {
    // Database sudah dapat berhasil diperbarui.
    // Kegagalan penghapusan dicatat agar bisa ditindaklanjuti.
    console.error(
      "Gagal menghapus object Supabase:",
      uniquePaths,
      error.message,
    );
  }
}

// =====================================================
// MIDDLEWARE UPLOAD KE SUPABASE
// =====================================================

export const attachUploadedStorageFiles: RequestHandler = async (
  req,
  _res,
  next,
) => {
  const uploaded: UploadedStorageFile[] = [];

  try {
    const files: Express.Multer.File[] = [];

    if (req.file) {
      files.push(req.file);
    }

    if (req.files) {
      if (Array.isArray(req.files)) {
        files.push(...req.files);
      } else {
        files.push(...Object.values(req.files).flat());
      }
    }

    if (files.length === 0) {
      (req as RequestWithUploadedStorageFiles).uploadedStorageFiles = [];
      return next();
    }

    // Upload secara berurutan agar file yang berhasil diunggah
    // dapat dibersihkan jika upload berikutnya gagal.
    for (const file of files) {
      const result = await uploadFotoWmToSupabase(file, "penggantian-wm");

      uploaded.push(result);
    }

    (req as RequestWithUploadedStorageFiles).uploadedStorageFiles = uploaded;

    return next();
  } catch (error) {
    // Hindari object yatim jika salah satu upload gagal.
    await deleteObjectsFromSupabase(uploaded.map((file) => file.path));

    return next(error);
  }
};
