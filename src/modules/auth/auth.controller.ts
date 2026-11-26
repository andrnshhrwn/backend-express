import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service.js";
import { AppError } from "../../shared/errors/app-error.js";

function getRefreshToken(req: Request): string {
  const token = req.body?.refresh_token;

  if (typeof token !== "string" || token.length === 0) {
    throw new AppError(
      400,
      "REFRESH_TOKEN_REQUIRED",
      "Refresh token wajib diisi",
    );
  }

  return token;
}

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;
      const clientPlatform = req.headers["x-client-platform"];

      const result = await authService.login(
        username,
        password,
        clientPlatform,
      );

      res.status(200).json({
        success: true,
        message: "Login berhasil",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await authService.refresh(getRefreshToken(req));

      res.status(200).json({
        success: true,
        message: "Token berhasil diperbarui",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.body?.refresh_token;

      if (typeof token === "string" && token.length > 0) {
        await authService.logout(token);
      }

      res.status(200).json({
        success: true,
        message: "Logout berhasil",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(
          new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan"),
        );
      }

      const result = await authService.me(req.user.id_user);

      res.status(200).json({
        success: true,
        message: "Profil pengguna berhasil diambil",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
