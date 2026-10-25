import type { Request, Response, NextFunction } from "express";
import { tipeTarifService } from "./tipe-tarif.service";
import { getStringParam } from "../../shared/utils/params";

export const tipeTarifController = {
  async findAll(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await tipeTarifService.findAll();

      res.status(200).json({
        success: true,
        message: "Daftar tipe tarif berhasil diambil",
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
      const data = await tipeTarifService.findById(getStringParam(req, "id"));

      res.status(200).json({
        success: true,
        message: "Detail tipe tarif berhasil diambil",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await tipeTarifService.create(req.body);

      res.status(201).json({
        success: true,
        message: "Tipe tarif berhasil dibuat",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await tipeTarifService.update(
        getStringParam(req, "id"),
        req.body,
      );

      res.status(200).json({
        success: true,
        message: "Tipe tarif berhasil diperbarui",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await tipeTarifService.delete(getStringParam(req, "id"));

      res.status(200).json({
        success: true,
        message: "Tipe tarif berhasil dihapus",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
