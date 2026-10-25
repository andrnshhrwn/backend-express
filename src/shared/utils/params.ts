import type { Request } from "express";
import { AppError } from "../errors/app-error";

export function getStringParam(req: Request, key: string): string {
  const value = req.params[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(
      400,
      "INVALID_PARAMETER",
      `Parameter ${key} tidak valid`,
    );
  }

  return value;
}
