import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { success } from "./shared/http/response.js";

import authRoutes from "./modules/auth/auth.routes";
import unitRoutes from "./modules/unit/unit.routes";
import merkWmRoutes from "./modules/merk-wm/merk-wm.routes";
import tipeTarifRoutes from "./modules/tipe-tarif/tipe-tarif.routes";

import pelangganRoutes from "./modules/pelanggan/pelanggan.routes";
import importPelangganRoutes from "./modules/pelanggan/import-pelanggan.routes";

import userRoutes from "./modules/users/user.routes";
import pengirimanWmRoutes from "./modules/pengiriman-wm/pengiriman-wm.routes";
import penugasanRoutes from "./modules/penugasan/penugasan.routes";
import penggantianWmRoutes from "./modules/penggantian-wm/penggantian-wm.routes";
import validasiRoutes from "./modules/validasi/validasi.routes";

export const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  return success(res, 200, {
    message: "API berjalan.",
    data: { status: "ok" },
  });
});

app.use(env.API_PREFIX + "/auth", authRoutes);
app.use(env.API_PREFIX + "/unit", unitRoutes);
app.use(env.API_PREFIX + "/merk-wm", merkWmRoutes);
app.use(env.API_PREFIX + "/tipe-tarif", tipeTarifRoutes);

app.use(env.API_PREFIX + "/pelanggan", pelangganRoutes);
app.use(env.API_PREFIX + "/pelanggan/import", importPelangganRoutes);

app.use(env.API_PREFIX + "/users", userRoutes);
app.use(env.API_PREFIX + "/pengiriman-wm", pengirimanWmRoutes);
app.use(env.API_PREFIX + "/penugasan", penugasanRoutes);
app.use(env.API_PREFIX + "/penggantian-wm", penggantianWmRoutes);
app.use(env.API_PREFIX + "/validasi", validasiRoutes);

app.use(env.API_PREFIX, (_req, res) => {
  return res.status(404).json({
    status: "error",
    code: "NOT_FOUND",
    message: "Endpoint tidak ditemukan.",
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);
