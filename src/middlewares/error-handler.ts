import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";

import { AppError } from "../shared/errors/app-error.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  // =====================================================
  // ZOD VALIDATION ERROR
  // =====================================================

  if (error instanceof ZodError) {
    return res.status(422).json({
      status: "error",
      code: "VALIDATION_FAILED",
      message: "Validasi input gagal.",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
      timestamp: new Date().toISOString(),
    });
  }

  // =====================================================
  // APP ERROR
  // =====================================================

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: "error",
      code: error.code,
      message: error.message,
      ...(error.errors ? { errors: error.errors } : {}),
      timestamp: new Date().toISOString(),
    });
  }

  // =====================================================
  // MULTER ERROR
  // =====================================================

  if (error instanceof multer.MulterError) {
    let message = "Terjadi kesalahan saat mengunggah file.";
    let responseCode: string = error.code;

    switch (error.code) {
      case "LIMIT_UNEXPECTED_FILE":
        responseCode = "UNEXPECTED_FILE_FIELD";
        message = `Field file "${error.field}" tidak dikenali atau melebihi batas jumlah file. Periksa kembali nama field upload.`;
        break;

      case "LIMIT_FILE_SIZE":
        responseCode = "FILE_TOO_LARGE";
        message = "Ukuran file melebihi batas maksimal yang diizinkan.";
        break;

      case "LIMIT_FILE_COUNT":
        responseCode = "TOO_MANY_FILES";
        message = "Jumlah file yang diunggah melebihi batas maksimal.";
        break;

      case "LIMIT_PART_COUNT":
        responseCode = "TOO_MANY_PARTS";
        message = "Jumlah bagian form-data melebihi batas maksimal.";
        break;

      case "LIMIT_FIELD_KEY":
        responseCode = "FIELD_NAME_TOO_LONG";
        message = "Nama field form-data terlalu panjang.";
        break;

      case "LIMIT_FIELD_VALUE":
        responseCode = "FIELD_VALUE_TOO_LONG";
        message = "Nilai field form-data terlalu panjang.";
        break;

      case "LIMIT_FIELD_COUNT":
        responseCode = "TOO_MANY_FIELDS";
        message = "Jumlah field form-data melebihi batas maksimal.";
        break;
    }

    return res.status(400).json({
      status: "error",
      code: responseCode,
      message,
      ...(error.field ? { field: error.field } : {}),
      timestamp: new Date().toISOString(),
    });
  }

  // =====================================================
  // UNKNOWN ERROR
  // =====================================================

  console.error(error);

  return res.status(500).json({
    status: "error",
    code: "INTERNAL_SERVER_ERROR",
    message: "Terjadi kesalahan pada server.",
    timestamp: new Date().toISOString(),
  });
};
