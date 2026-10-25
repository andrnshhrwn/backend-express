
import type { Response } from "express";

interface SuccessOptions<T> {
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total_records: number;
    total_pages: number;
  };
}

export function success<T>(
  res: Response,
  statusCode: number,
  options: SuccessOptions<T>,
) {
  return res.status(statusCode).json({
    status: "success",
    message: options.message,
    data: options.data,
    ...(options.meta ? { meta: options.meta } : {}),
  });
}
