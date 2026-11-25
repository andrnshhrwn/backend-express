// import type { Request, Response, NextFunction } from "express";
// import { AppError } from "../../shared/errors/app-error";
// import { userService } from "./user.service";

// function getUserId(req: Request): string {
//   const id = req.params.id;

//   if (typeof id !== "string") {
//     throw new AppError(400, "INVALID_USER_ID", "ID pengguna tidak valid");
//   }

//   return id;
// }

// export const userController = {
//   async findAll(
//     _req: Request,
//     res: Response,
//     next: NextFunction,
//   ): Promise<void> {
//     try {
//       const data = await userService.findAll();

//       res.status(200).json({
//         success: true,
//         message: "Daftar pengguna berhasil diambil",
//         data,
//       });
//     } catch (error) {
//       next(error);
//     }
//   },

//   async findById(
//     req: Request,
//     res: Response,
//     next: NextFunction,
//   ): Promise<void> {
//     try {
//       const data = await userService.findById(getUserId(req));

//       res.status(200).json({
//         success: true,
//         message: "Detail pengguna berhasil diambil",
//         data,
//       });
//     } catch (error) {
//       next(error);
//     }
//   },

//   async findTeknisi(
//     req: Request,
//     res: Response,
//     next: NextFunction,
//   ): Promise<void> {
//     try {
//       if (!req.user || req.user.role !== "admin_cabang") {
//         throw new AppError(403, "FORBIDDEN", "Akses hanya untuk admin cabang");
//       }

//       const data = await userService.findTeknisiByUnit(req.user.id_unit);

//       res.status(200).json({
//         success: true,
//         message: "Daftar teknisi berhasil diambil",
//         data,
//       });
//     } catch (error) {
//       next(error);
//     }
//   },

//   async createTeknisi(
//     req: Request,
//     res: Response,
//     next: NextFunction,
//   ): Promise<void> {
//     try {
//       if (!req.user || req.user.role !== "admin_cabang") {
//         throw new AppError(403, "FORBIDDEN", "Akses hanya untuk admin cabang");
//       }

//       const data = await userService.createTeknisiByUnit(
//         req.body,
//         req.user.id_unit,
//       );

//       res.status(201).json({
//         success: true,
//         message: "Teknisi berhasil ditambahkan",
//         data,
//       });
//     } catch (error) {
//       next(error);
//     }
//   },

//   async create(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const data = await userService.create(req.body);

//       res.status(201).json({
//         success: true,
//         message: "Pengguna berhasil dibuat",
//         data,
//       });
//     } catch (error) {
//       next(error);
//     }
//   },

//   async update(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const data = await userService.update(getUserId(req), req.body);

//       res.status(200).json({
//         success: true,
//         message: "Pengguna berhasil diperbarui",
//         data,
//       });
//     } catch (error) {
//       next(error);
//     }
//   },
// };

import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../shared/errors/app-error";
import { userService } from "./user.service";

function getUserId(req: Request): string {
  const id = req.params.id;

  if (typeof id !== "string") {
    throw new AppError(400, "INVALID_USER_ID", "ID pengguna tidak valid");
  }

  return id;
}

export const userController = {
  async findAll(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await userService.findAll();

      res.status(200).json({
        success: true,
        message: "Daftar pengguna berhasil diambil",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await userService.findById(getUserId(req));

      res.status(200).json({
        success: true,
        message: "Detail pengguna berhasil diambil",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async findTeknisi(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user || req.user.role !== "admin_cabang") {
        throw new AppError(403, "FORBIDDEN", "Akses hanya untuk admin cabang");
      }

      const data = await userService.findTeknisiByUnit(req.user.id_unit);

      res.status(200).json({
        success: true,
        message: "Daftar teknisi berhasil diambil",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async createTeknisi(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user || req.user.role !== "admin_cabang") {
        throw new AppError(403, "FORBIDDEN", "Akses hanya untuk admin cabang");
      }

      const data = await userService.createTeknisiByUnit(
        req.body,
        req.user.id_unit,
      );

      res.status(201).json({
        success: true,
        message: "Teknisi berhasil ditambahkan",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await userService.create(req.body);

      res.status(201).json({
        success: true,
        message: "Pengguna berhasil dibuat",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await userService.update(getUserId(req), req.body);

      res.status(200).json({
        success: true,
        message: "Pengguna berhasil diperbarui",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
