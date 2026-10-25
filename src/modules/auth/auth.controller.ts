import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { AppError } from "../../shared/errors/app-error";

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;

      const result = await authService.login(username, password);

      res.status(200).json({
        success: true,
        message: "Login berhasil",
        data: result,
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
