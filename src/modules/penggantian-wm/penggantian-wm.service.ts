// import { AppError } from "../../shared/errors/app-error";
// import { penggantianWmRepository } from "./penggantian-wm.repository";

// import type {
//   SubmitDataWmLamaInput,
//   SelesaikanPenggantianWmInput,
//   PerbaikiPenggantianWmInput,
//   ListPenggantianWmQuery,
// } from "./penggantian-wm.validator";

// import type { AuthUser } from "../../middlewares/authenticate";

// import { env } from "../../config/env.js";
// import path from "node:path";
// import { unlink } from "node:fs/promises";

// function buildAccessScope(user: AuthUser) {
//   if (user.role === "admin_pusat") {
//     return {};
//   }

//   if (user.role === "admin_cabang") {
//     if (user.id_unit === null) {
//       throw new AppError(
//         403,
//         "UNIT_ACCESS_DENIED",
//         "Akun admin cabang tidak memiliki unit.",
//       );
//     }

//     return {
//       id_unit: user.id_unit,
//     };
//   }

//   return {
//     id_teknisi: user.id_user,
//   };
// }

// function isPrismaUniqueConstraintError(error: unknown): boolean {
//   return (
//     typeof error === "object" &&
//     error !== null &&
//     "code" in error &&
//     error.code === "P2002"
//   );
// }

// function getUniqueConstraintTarget(error: unknown): string {
//   if (typeof error !== "object" || error === null || !("meta" in error)) {
//     return "";
//   }

//   const meta = error.meta;

//   if (typeof meta !== "object" || meta === null || !("target" in meta)) {
//     return "";
//   }

//   const target = meta.target;

//   return Array.isArray(target)
//     ? target.join(" ").toLowerCase()
//     : String(target ?? "").toLowerCase();
// }

// function throwDuplicateSerialError(error: unknown): never {
//   if (isPrismaUniqueConstraintError(error)) {
//     const target = getUniqueConstraintTarget(error);

//     if (target.includes("no_seri_wm_baru")) {
//       throw new AppError(
//         409,
//         "NO_SERI_WM_BARU_ALREADY_EXISTS",
//         "Nomor seri WM baru sudah digunakan pada data penggantian WM lain.",
//       );
//     }

//     if (target.includes("no_seri_wm_lama")) {
//       throw new AppError(
//         409,
//         "NO_SERI_WM_SUDAH_DIGUNAKAN",
//         "Nomor seri WM lama sudah digunakan pada data penggantian WM lain.",
//       );
//     }
//   }

//   throw error;
// }

// function resolveStoredImagePath(storedPath: string): string | null {
//   const expectedPrefix = "/uploads/penggantian-wm/";

//   if (!storedPath.startsWith(expectedPrefix)) {
//     return null;
//   }

//   const filename = path.basename(storedPath);

//   if (!filename || filename === "." || filename === "..") {
//     return null;
//   }

//   return path.resolve(
//     process.cwd(),
//     env.UPLOAD_DIR,
//     "penggantian-wm",
//     filename,
//   );
// }

// async function deleteOldImages(paths: string[]) {
//   const uniquePaths = [...new Set(paths)];

//   await Promise.all(
//     uniquePaths.map(async (storedPath) => {
//       const filePath = resolveStoredImagePath(storedPath);

//       if (!filePath) {
//         return;
//       }

//       await unlink(filePath).catch(() => undefined);
//     }),
//   );
// }

// export const penggantianWmService = {
//   async getAll(filters: ListPenggantianWmQuery, user: AuthUser) {
//     const scope = buildAccessScope(user);

//     return penggantianWmRepository.findAll(filters, scope);
//   },

//   async getStok(user: AuthUser) {
//     if (user.role !== "admin_pusat" && user.role !== "admin_cabang") {
//       throw new AppError(
//         403,
//         "FORBIDDEN",
//         "Hanya Admin Pusat dan Admin Cabang yang dapat melihat ringkasan stok WM.",
//       );
//     }

//     const scope = buildAccessScope(user);

//     return penggantianWmRepository.findStok(scope);
//   },

//   async getById(id: string, user: AuthUser) {
//     const scope = buildAccessScope(user);

//     const data = await penggantianWmRepository.findById(id, scope);

//     if (!data) {
//       throw new AppError(404, "BAP_NOT_FOUND", "Data BAP tidak ditemukan.");
//     }

//     return data;
//   },

//   async submitDataWmLama(
//     idPenugasan: string,
//     input: SubmitDataWmLamaInput,
//     pathImageWmLama: string,
//     idTeknisi: string,
//   ) {
//     const result = await penggantianWmRepository.submitDataWmLama(
//       idPenugasan,
//       input,
//       pathImageWmLama,
//       idTeknisi,
//     );

//     switch (result.kind) {
//       case "PENUGASAN_NOT_FOUND":
//         throw new AppError(404, "PENUGASAN_NOT_FOUND", "SPK tidak ditemukan.");

//       case "FORBIDDEN_TEKNISI":
//         throw new AppError(
//           403,
//           "FORBIDDEN_TEKNISI",
//           "Kamu tidak ditugaskan pada SPK ini.",
//         );

//       case "PENUGASAN_TIDAK_PENDING":
//         throw new AppError(
//           409,
//           "PENUGASAN_TIDAK_PENDING",
//           "Data WM lama hanya dapat dikonfirmasi pada SPK berstatus pending.",
//         );

//       case "BAP_ALREADY_EXISTS":
//         throw new AppError(
//           409,
//           "BAP_ALREADY_EXISTS",
//           "SPK ini sudah memiliki data penggantian WM.",
//         );

//       case "NO_SERI_WM_SUDAH_DIGUNAKAN":
//         throw new AppError(
//           409,
//           "NO_SERI_WM_SUDAH_DIGUNAKAN",
//           "Nomor seri WM lama sudah pernah tercatat pada data penggantian WM lain.",
//         );

//       case "CREATED":
//         return result.data;
//     }
//   },

//   async selesaikan(
//     idPenggantian: string,
//     input: SelesaikanPenggantianWmInput,
//     pathImageWmBaru: string,
//     idTeknisi: string,
//   ) {
//     let result;

//     try {
//       result = await penggantianWmRepository.selesaikan(
//         idPenggantian,
//         input,
//         pathImageWmBaru,
//         idTeknisi,
//       );
//     } catch (error) {
//       throwDuplicateSerialError(error);
//     }

//     switch (result.kind) {
//       case "BAP_NOT_FOUND":
//         throw new AppError(404, "BAP_NOT_FOUND", "Data BAP tidak ditemukan.");

//       case "PENUGASAN_NOT_FOUND":
//         throw new AppError(404, "PENUGASAN_NOT_FOUND", "SPK tidak ditemukan.");

//       case "UNIT_NOT_FOUND":
//         throw new AppError(
//           404,
//           "UNIT_NOT_FOUND",
//           "Unit tujuan tidak ditemukan.",
//         );

//       case "FORBIDDEN_TEKNISI":
//         throw new AppError(
//           403,
//           "FORBIDDEN_TEKNISI",
//           "Kamu tidak ditugaskan pada SPK ini.",
//         );

//       case "BAP_TAHAP_TIDAK_VALID":
//         throw new AppError(
//           409,
//           "BAP_TAHAP_TIDAK_VALID",
//           "Data WM lama belum dikonfirmasi atau BAP sudah diselesaikan.",
//         );

//       case "PENUGASAN_TIDAK_PROSES":
//         throw new AppError(
//           409,
//           "PENUGASAN_TIDAK_PROSES",
//           "SPK harus berstatus proses untuk menyelesaikan penggantian WM.",
//         );

//       case "BAP_DATA_BELUM_LENGKAP":
//         throw new AppError(
//           409,
//           "BAP_DATA_BELUM_LENGKAP",
//           "Data BAP belum lengkap. Lengkapi seluruh data dan foto sebelum mengajukan validasi.",
//         );

//       case "MERK_WM_NOT_FOUND":
//         throw new AppError(
//           404,
//           "MERK_WM_NOT_FOUND",
//           "Merek WM yang dipilih tidak ditemukan.",
//         );

//       case "STOK_WM_TIDAK_CUKUP":
//         throw new AppError(
//           409,
//           "STOK_WM_TIDAK_CUKUP",
//           "Stok WM dengan merek yang dipilih tidak mencukupi pada unit ini.",
//         );

//       case "NO_SERI_WM_SAMA":
//         throw new AppError(
//           400,
//           "NO_SERI_WM_SAMA",
//           "Nomor seri WM baru tidak boleh sama dengan nomor seri WM lama.",
//         );

//       case "NO_SERI_WM_BARU_ALREADY_EXISTS":
//         throw new AppError(
//           409,
//           "NO_SERI_WM_BARU_ALREADY_EXISTS",
//           "Nomor seri WM baru sudah digunakan pada data penggantian WM lain.",
//         );

//       case "COMPLETED":
//         return result.data;
//     }
//   },

//   async perbaiki(
//     idPenggantian: string,
//     input: PerbaikiPenggantianWmInput,
//     pathImageWmLama: string | undefined,
//     pathImageWmBaru: string | undefined,
//     idTeknisi: string,
//   ) {
//     let result;

//     try {
//       result = await penggantianWmRepository.perbaiki(
//         idPenggantian,
//         input,
//         pathImageWmLama,
//         pathImageWmBaru,
//         idTeknisi,
//       );
//     } catch (error) {
//       throwDuplicateSerialError(error);
//     }

//     switch (result.kind) {
//       case "BAP_NOT_FOUND":
//         throw new AppError(404, "BAP_NOT_FOUND", "Data BAP tidak ditemukan.");

//       case "PENUGASAN_NOT_FOUND":
//         throw new AppError(404, "PENUGASAN_NOT_FOUND", "SPK tidak ditemukan.");

//       case "FORBIDDEN_TEKNISI":
//         throw new AppError(
//           403,
//           "FORBIDDEN_TEKNISI",
//           "Kamu tidak ditugaskan pada SPK ini.",
//         );

//       case "BAP_NOT_REJECTED":
//         throw new AppError(
//           409,
//           "BAP_TIDAK_DITOLAK",
//           "Perbaikan hanya dapat dilakukan pada BAP yang ditolak.",
//         );

//       case "BAP_TAHAP_TIDAK_VALID":
//         throw new AppError(
//           409,
//           "BAP_TAHAP_TIDAK_VALID",
//           "Tahap penggantian WM tidak memungkinkan untuk diperbaiki.",
//         );

//       case "PENUGASAN_TIDAK_SELESAI":
//         throw new AppError(
//           409,
//           "PENUGASAN_TIDAK_SELESAI",
//           "SPK harus berstatus selesai untuk memperbaiki BAP.",
//         );

//       case "BAP_DATA_BELUM_LENGKAP":
//         throw new AppError(
//           409,
//           "BAP_DATA_BELUM_LENGKAP",
//           "Hasil perbaikan BAP belum lengkap. Lengkapi seluruh data dan foto sebelum mengajukan ulang.",
//         );

//       case "NO_SERI_WM_SAMA":
//         throw new AppError(
//           400,
//           "NO_SERI_WM_SAMA",
//           "Nomor seri WM baru tidak boleh sama dengan nomor seri WM lama.",
//         );

//       case "NO_SERI_WM_BARU_ALREADY_EXISTS":
//         throw new AppError(
//           409,
//           "NO_SERI_WM_BARU_ALREADY_EXISTS",
//           "Nomor seri WM baru sudah digunakan pada data penggantian WM lain.",
//         );

//       case "UPDATED":
//         await deleteOldImages(result.oldImagePaths);
//         return result.data;
//     }
//   },
// };

import { AppError } from "../../shared/errors/app-error";
import { deleteObjectsFromSupabase } from "../../middlewares/upload";

import { penggantianWmRepository } from "./penggantian-wm.repository";

import type {
  SubmitDataWmLamaInput,
  SelesaikanPenggantianWmInput,
  PerbaikiPenggantianWmInput,
  ListPenggantianWmQuery,
} from "./penggantian-wm.validator";

import type { AuthUser } from "../../middlewares/authenticate";

function buildAccessScope(user: AuthUser) {
  if (user.role === "admin_pusat") {
    return {};
  }

  if (user.role === "admin_cabang") {
    if (user.id_unit === null) {
      throw new AppError(
        403,
        "UNIT_ACCESS_DENIED",
        "Akun admin cabang tidak memiliki unit.",
      );
    }

    return {
      id_unit: user.id_unit,
    };
  }

  return {
    id_teknisi: user.id_user,
  };
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function getUniqueConstraintTarget(error: unknown): string {
  if (typeof error !== "object" || error === null || !("meta" in error)) {
    return "";
  }

  const meta = error.meta;

  if (typeof meta !== "object" || meta === null || !("target" in meta)) {
    return "";
  }

  const target = meta.target;

  return Array.isArray(target)
    ? target.join(" ").toLowerCase()
    : String(target ?? "").toLowerCase();
}

function throwDuplicateSerialError(error: unknown): never {
  if (isPrismaUniqueConstraintError(error)) {
    const target = getUniqueConstraintTarget(error);

    if (target.includes("no_seri_wm_baru")) {
      throw new AppError(
        409,
        "NO_SERI_WM_BARU_ALREADY_EXISTS",
        "Nomor seri WM baru sudah digunakan pada data penggantian WM lain.",
      );
    }

    if (target.includes("no_seri_wm_lama")) {
      throw new AppError(
        409,
        "NO_SERI_WM_SUDAH_DIGUNAKAN",
        "Nomor seri WM lama sudah digunakan pada data penggantian WM lain.",
      );
    }
  }

  throw error;
}

export const penggantianWmService = {
  async getAll(filters: ListPenggantianWmQuery, user: AuthUser) {
    const scope = buildAccessScope(user);

    return penggantianWmRepository.findAll(filters, scope);
  },

  async getStok(user: AuthUser) {
    if (user.role !== "admin_pusat" && user.role !== "admin_cabang") {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Hanya Admin Pusat dan Admin Cabang yang dapat melihat ringkasan stok WM.",
      );
    }

    const scope = buildAccessScope(user);

    return penggantianWmRepository.findStok(scope);
  },

  async getById(id: string, user: AuthUser) {
    const scope = buildAccessScope(user);

    const data = await penggantianWmRepository.findById(id, scope);

    if (!data) {
      throw new AppError(404, "BAP_NOT_FOUND", "Data BAP tidak ditemukan.");
    }

    return data;
  },

  // ===================================================
  // TAHAP 1: SIMPAN DATA WM LAMA
  // ===================================================

  async submitDataWmLama(
    idPenugasan: string,
    input: SubmitDataWmLamaInput,
    pathImageWmLama: string,
    idTeknisi: string,
  ) {
    const result = await penggantianWmRepository.submitDataWmLama(
      idPenugasan,
      input,
      pathImageWmLama,
      idTeknisi,
    );

    switch (result.kind) {
      case "PENUGASAN_NOT_FOUND":
        throw new AppError(404, "PENUGASAN_NOT_FOUND", "SPK tidak ditemukan.");

      case "FORBIDDEN_TEKNISI":
        throw new AppError(
          403,
          "FORBIDDEN_TEKNISI",
          "Kamu tidak ditugaskan pada SPK ini.",
        );

      case "PENUGASAN_TIDAK_PENDING":
        throw new AppError(
          409,
          "PENUGASAN_TIDAK_PENDING",
          "Data WM lama hanya dapat dikonfirmasi pada SPK berstatus pending.",
        );

      case "BAP_ALREADY_EXISTS":
        throw new AppError(
          409,
          "BAP_ALREADY_EXISTS",
          "SPK ini sudah memiliki data penggantian WM.",
        );

      case "NO_SERI_WM_SUDAH_DIGUNAKAN":
        throw new AppError(
          409,
          "NO_SERI_WM_SUDAH_DIGUNAKAN",
          "Nomor seri WM lama sudah pernah tercatat pada data penggantian WM lain.",
        );

      case "CREATED":
        return result.data;
    }
  },

  // ===================================================
  // TAHAP 2: SELESAIKAN PEMASANGAN WM BARU
  // ===================================================

  async selesaikan(
    idPenggantian: string,
    input: SelesaikanPenggantianWmInput,
    pathImageWmBaru: string,
    idTeknisi: string,
  ) {
    let result;

    try {
      result = await penggantianWmRepository.selesaikan(
        idPenggantian,
        input,
        pathImageWmBaru,
        idTeknisi,
      );
    } catch (error) {
      throwDuplicateSerialError(error);
    }

    switch (result.kind) {
      case "BAP_NOT_FOUND":
        throw new AppError(404, "BAP_NOT_FOUND", "Data BAP tidak ditemukan.");

      case "PENUGASAN_NOT_FOUND":
        throw new AppError(404, "PENUGASAN_NOT_FOUND", "SPK tidak ditemukan.");

      case "UNIT_NOT_FOUND":
        throw new AppError(
          404,
          "UNIT_NOT_FOUND",
          "Unit tujuan tidak ditemukan.",
        );

      case "FORBIDDEN_TEKNISI":
        throw new AppError(
          403,
          "FORBIDDEN_TEKNISI",
          "Kamu tidak ditugaskan pada SPK ini.",
        );

      case "BAP_TAHAP_TIDAK_VALID":
        throw new AppError(
          409,
          "BAP_TAHAP_TIDAK_VALID",
          "Data WM lama belum dikonfirmasi atau BAP sudah diselesaikan.",
        );

      case "PENUGASAN_TIDAK_PROSES":
        throw new AppError(
          409,
          "PENUGASAN_TIDAK_PROSES",
          "SPK harus berstatus proses untuk menyelesaikan penggantian WM.",
        );

      case "BAP_DATA_BELUM_LENGKAP":
        throw new AppError(
          409,
          "BAP_DATA_BELUM_LENGKAP",
          "Data BAP belum lengkap. Lengkapi seluruh data dan foto sebelum mengajukan validasi.",
        );

      case "MERK_WM_NOT_FOUND":
        throw new AppError(
          404,
          "MERK_WM_NOT_FOUND",
          "Merek WM yang dipilih tidak ditemukan.",
        );

      case "STOK_WM_TIDAK_CUKUP":
        throw new AppError(
          409,
          "STOK_WM_TIDAK_CUKUP",
          "Stok WM dengan merek yang dipilih tidak mencukupi pada unit ini.",
        );

      case "NO_SERI_WM_SAMA":
        throw new AppError(
          400,
          "NO_SERI_WM_SAMA",
          "Nomor seri WM baru tidak boleh sama dengan nomor seri WM lama.",
        );

      case "NO_SERI_WM_BARU_ALREADY_EXISTS":
        throw new AppError(
          409,
          "NO_SERI_WM_BARU_ALREADY_EXISTS",
          "Nomor seri WM baru sudah digunakan pada data penggantian WM lain.",
        );

      case "COMPLETED":
        return result.data;
    }
  },

  // ===================================================
  // PERBAIKAN BAP YANG DITOLAK
  // ===================================================

  async perbaiki(
    idPenggantian: string,
    input: PerbaikiPenggantianWmInput,
    pathImageWmLama: string | undefined,
    pathImageWmBaru: string | undefined,
    idTeknisi: string,
  ) {
    let result;

    try {
      result = await penggantianWmRepository.perbaiki(
        idPenggantian,
        input,
        pathImageWmLama,
        pathImageWmBaru,
        idTeknisi,
      );
    } catch (error) {
      throwDuplicateSerialError(error);
    }

    switch (result.kind) {
      case "BAP_NOT_FOUND":
        throw new AppError(404, "BAP_NOT_FOUND", "Data BAP tidak ditemukan.");

      case "PENUGASAN_NOT_FOUND":
        throw new AppError(404, "PENUGASAN_NOT_FOUND", "SPK tidak ditemukan.");

      case "FORBIDDEN_TEKNISI":
        throw new AppError(
          403,
          "FORBIDDEN_TEKNISI",
          "Kamu tidak ditugaskan pada SPK ini.",
        );

      case "BAP_NOT_REJECTED":
        throw new AppError(
          409,
          "BAP_TIDAK_DITOLAK",
          "Perbaikan hanya dapat dilakukan pada BAP yang ditolak.",
        );

      case "BAP_TAHAP_TIDAK_VALID":
        throw new AppError(
          409,
          "BAP_TAHAP_TIDAK_VALID",
          "Tahap penggantian WM tidak memungkinkan untuk diperbaiki.",
        );

      case "PENUGASAN_TIDAK_SELESAI":
        throw new AppError(
          409,
          "PENUGASAN_TIDAK_SELESAI",
          "SPK harus berstatus selesai untuk memperbaiki BAP.",
        );

      case "BAP_DATA_BELUM_LENGKAP":
        throw new AppError(
          409,
          "BAP_DATA_BELUM_LENGKAP",
          "Hasil perbaikan BAP belum lengkap. Lengkapi seluruh data dan foto sebelum mengajukan ulang.",
        );

      case "NO_SERI_WM_SAMA":
        throw new AppError(
          400,
          "NO_SERI_WM_SAMA",
          "Nomor seri WM baru tidak boleh sama dengan nomor seri WM lama.",
        );

      case "NO_SERI_WM_BARU_ALREADY_EXISTS":
        throw new AppError(
          409,
          "NO_SERI_WM_BARU_ALREADY_EXISTS",
          "Nomor seri WM baru sudah digunakan pada data penggantian WM lain.",
        );

      case "UPDATED":
        // Foto lama dihapus setelah perubahan database berhasil.
        await deleteObjectsFromSupabase(result.oldImagePaths);

        return result.data;
    }
  },
};
