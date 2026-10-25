
import type {
  ErrorRequestHandler,
} from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/errors/app-error.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
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

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: "error",
      code: error.code,
      message: error.message,
      ...(error.errors ? { errors: error.errors } : {}),
      timestamp: new Date().toISOString(),
    });
  }

  console.error(error);

  return res.status(500).json({
    status: "error",
    code: "INTERNAL_SERVER_ERROR",
    message: "Terjadi kesalahan pada server.",
    timestamp: new Date().toISOString(),
  });
};
