import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { AppError } from "../shared/errors/app-error";

type ValidateTarget = "body" | "params" | "query";

export function validate(schema: ZodType, target: ValidateTarget = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      return next(
        new AppError(
          422,
          "VALIDATION_FAILED",
          "Validasi input gagal.",
          result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        ),
      );
    }

    if (target === "body") {
      req.body = result.data;
    } else if (target === "params") {
      const parsedParams = result.data as Record<string, unknown>;

      for (const key of Object.keys(parsedParams)) {
        req.params[key] = String(parsedParams[key]);
      }
    } else {
      res.locals.validatedQuery = result.data;
    }

    next();
  };
}
