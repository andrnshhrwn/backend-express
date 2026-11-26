import express from "express";
import cors from "cors";
import path from "node:path";

import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { success } from "./shared/http/response.js";

import authRoutes from "./modules/auth/auth.routes.js";
import unitRoutes from "./modules/unit/unit.routes.js";
import merkWmRoutes from "./modules/merk-wm/merk-wm.routes.js";
import tipeTarifRoutes from "./modules/tipe-tarif/tipe-tarif.routes.js";

import pelangganRoutes from "./modules/pelanggan/pelanggan.routes.js";
import importPelangganRoutes from "./modules/pelanggan/import-pelanggan.routes.js";

import userRoutes from "./modules/users/user.routes.js";
import pengirimanWmRoutes from "./modules/pengiriman-wm/pengiriman-wm.routes.js";
import penugasanRoutes from "./modules/penugasan/penugasan.routes.js";
import penggantianWmRoutes from "./modules/penggantian-wm/penggantian-wm.routes.js";
import validasiRoutes from "./modules/validasi/validasi.routes.js";

import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";

import laporanRoutes from "./modules/laporan/laporan.routes.js";

export const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Client-Platform"],
  }),
);

app.use(express.json({ limit: "1mb" }));

// Menyajikan file foto yang tersimpan di folder uploads
app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)),
);

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

app.use(env.API_PREFIX + "/dashboard", dashboardRoutes);

app.use(env.API_PREFIX + "/laporan", laporanRoutes);

app.use(env.API_PREFIX, (_req, res) => {
  return res.status(404).json({
    status: "error",
    code: "NOT_FOUND",
    message: "Endpoint tidak ditemukan.",
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);
export default app;