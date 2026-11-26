<<<<<<< HEAD
import type { Prisma } from "../../generated/prisma/client";
import { AppError } from "../../shared/errors/app-error";
import type { AuthUser } from "../../middlewares/authenticate";
import { laporanRepository } from "./laporan.repository";
=======
import type { Prisma } from "../../generated/prisma-mysql/client.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthUser } from "../../middlewares/authenticate.js";
import { laporanRepository } from "./laporan.repository.js";
>>>>>>> prod
import {
  createExcelFile,
  formatDateOnly,
  formatDateTimeWib,
} from "./laporan.export.js";

interface BaseQuery {
  dari?: string;
  sampai?: string;
  id_unit?: string;
  page: number;
  limit: number;
}

interface PenugasanQuery extends BaseQuery {
  status?: "pending" | "proses" | "selesai" | "dibatalkan";
  id_teknisi?: string;
}

interface PenggantianQuery extends BaseQuery {
  status_validasi?: "menunggu" | "disetujui" | "ditolak";
  tahap_penggantian?: "data_wm_lama" | "menunggu_validasi";
}

function dateOnlyRange(dari?: string, sampai?: string) {
  if (!dari && !sampai) return undefined;

  return {
    ...(dari ? { gte: new Date(`${dari}T00:00:00.000Z`) } : {}),
    ...(sampai ? { lte: new Date(`${sampai}T00:00:00.000Z`) } : {}),
  };
}

function dateTimeRange(dari?: string, sampai?: string) {
  if (!dari && !sampai) return undefined;

  return {
    ...(dari ? { gte: new Date(`${dari}T00:00:00+07:00`) } : {}),
    ...(sampai
      ? {
          lt: new Date(
            new Date(`${sampai}T00:00:00+07:00`).getTime() +
              24 * 60 * 60 * 1000,
          ),
        }
      : {}),
  };
}

function resolveUnit(user: AuthUser, requested?: string): string | undefined {
  if (user.role === "admin_cabang") {
    if (!user.id_unit) {
      throw new AppError(403, "UNIT_REQUIRED", "Akun belum terhubung ke unit");
    }

    return user.id_unit;
  }

  return requested;
}

function paging(q: BaseQuery) {
  return {
    skip: (q.page - 1) * q.limit,
    take: q.limit,
    meta: (total: number) => ({
      page: q.page,
      limit: q.limit,
      total_records: total,
      total_pages: Math.max(1, Math.ceil(total / q.limit)),
    }),
  };
}

function buildPengirimanWhere(
  id_unit: string | undefined,
  q: BaseQuery,
): Prisma.PengirimanWmWhereInput {
  return {
    ...(id_unit ? { id_unit_tujuan: id_unit } : {}),
    ...(q.dari || q.sampai
      ? { tgl_pengiriman: dateOnlyRange(q.dari, q.sampai) }
      : {}),
  };
}

function buildPenugasanWhere(
  id_unit: string | undefined,
  q: PenugasanQuery,
): Prisma.PenugasanWhereInput {
  return {
    ...(id_unit ? { id_unit } : {}),
    ...(q.status ? { status: q.status } : {}),
    ...(q.id_teknisi ? { id_teknisi: q.id_teknisi } : {}),
    ...(q.dari || q.sampai
      ? { tgl_penugasan: dateTimeRange(q.dari, q.sampai) }
      : {}),
  };
}

function buildPenggantianWhere(
  id_unit: string | undefined,
  q: PenggantianQuery,
): Prisma.PenggantianWmWhereInput {
  return {
    ...(id_unit ? { penugasan: { is: { id_unit } } } : {}),
    ...(q.status_validasi ? { status_validasi: q.status_validasi } : {}),
    ...(q.tahap_penggantian ? { tahap_penggantian: q.tahap_penggantian } : {}),
    ...(q.dari || q.sampai
      ? { tgl_penggantian: dateTimeRange(q.dari, q.sampai) }
      : {}),
  };
}

function exportFileName(
  prefix: string,
  dari?: string,
  sampai?: string,
): string {
  const period =
    dari || sampai
      ? `${dari ?? "awal"}-sampai-${sampai ?? "akhir"}`
      : "semua-periode";

  return `${prefix}-${period}.xlsx`;
}

export const laporanService = {
  async pengiriman(user: AuthUser, q: BaseQuery) {
    const id_unit = resolveUnit(user, q.id_unit);
    const p = paging(q);
    const where = buildPengirimanWhere(id_unit, q);

    const { items, total, totalWm } = await laporanRepository.pengiriman(
      where,
      p.skip,
      p.take,
    );

    return {
      data: {
        items,
        summary: {
          total_pengiriman: total,
          total_wm: totalWm,
        },
      },
      meta: p.meta(total),
    };
  },

  async penugasan(user: AuthUser, q: PenugasanQuery) {
    const id_unit = resolveUnit(user, q.id_unit);
    const p = paging(q);
    const where = buildPenugasanWhere(id_unit, q);

    const { items, total, grouped } = await laporanRepository.penugasan(
      where,
      p.skip,
      p.take,
    );

    const per_status = {
      pending: 0,
      proses: 0,
      selesai: 0,
      dibatalkan: 0,
    };

    for (const g of grouped) {
      per_status[g.status] = g._count._all;
    }

    return {
      data: { items, summary: { total, per_status } },
      meta: p.meta(total),
    };
  },

  async penggantian(user: AuthUser, q: PenggantianQuery) {
    const id_unit = resolveUnit(user, q.id_unit);
    const p = paging(q);
    const where = buildPenggantianWhere(id_unit, q);

    const { items, total, grouped } = await laporanRepository.penggantian(
      where,
      p.skip,
      p.take,
    );

    const per_status_validasi = {
      belum_diajukan: 0,
      menunggu: 0,
      disetujui: 0,
      ditolak: 0,
    };

    for (const g of grouped) {
      per_status_validasi[g.status_validasi ?? "belum_diajukan"] =
        g._count._all;
    }

    return {
      data: { items, summary: { total, per_status_validasi } },
      meta: p.meta(total),
    };
  },

  async exportPengiriman(user: AuthUser, q: BaseQuery) {
    const id_unit = resolveUnit(user, q.id_unit);
    const where = buildPengirimanWhere(id_unit, q);
    const items = await laporanRepository.pengirimanExport(where);

    const totalWm = items.reduce((total, item) => total + item.total_wm, 0);

    const rows = items.map((item) => ({
      "Nomor Pengiriman": item.no_pengiriman,
      "Tanggal Pengiriman": formatDateOnly(item.tgl_pengiriman),
      "Kode Unit": item.unit_tujuan.kode_unit,
      "Nama Unit": item.unit_tujuan.nama_unit,
      "Total WM": item.total_wm,
      "Detail WM": item.details
        .map(
          (detail) =>
            `${detail.merk.kode_wm} - ${detail.merk.merk_wm} (${detail.jumlah})`,
        )
        .join("; "),
      "Dicatat Oleh": item.user_pencatat.fullname,
      Catatan: item.catatan ?? "-",
    }));

    const buffer = createExcelFile({
      fileName: exportFileName("laporan-pengiriman-wm", q.dari, q.sampai),
      sheetName: "Data Pengiriman",
      title: "Laporan Pengiriman Water Meter",
      exportedAt: new Date(),
      period: { dari: q.dari, sampai: q.sampai },
      summary: {
        "Total Pengiriman": items.length,
        "Total Water Meter": totalWm,
      },
      columns: [
        "Nomor Pengiriman",
        "Tanggal Pengiriman",
        "Kode Unit",
        "Nama Unit",
        "Total WM",
        "Detail WM",
        "Dicatat Oleh",
        "Catatan",
      ],
      rows,
    });

    return {
      buffer,
      fileName: exportFileName("laporan-pengiriman-wm", q.dari, q.sampai),
    };
  },

  async exportPenugasan(user: AuthUser, q: PenugasanQuery) {
    const id_unit = resolveUnit(user, q.id_unit);
    const where = buildPenugasanWhere(id_unit, q);
    const items = await laporanRepository.penugasanExport(where);

    const per_status = {
      pending: 0,
      proses: 0,
      selesai: 0,
      dibatalkan: 0,
    };

    for (const item of items) {
      per_status[item.status] += 1;
    }

    const rows = items.map((item) => ({
      "Nomor SPK": item.nomor_spk,
      "Tanggal Penugasan": formatDateTimeWib(item.tgl_penugasan),
      "ID Pelanggan PDAM": item.pelanggan.id_pelanggan_pdam,
      "Nama Pelanggan": item.pelanggan.nama,
      Alamat: item.pelanggan.alamat,
      "Kode Unit": item.unit.kode_unit,
      "Nama Unit": item.unit.nama_unit,
      "Dibuat Oleh": item.pembuat.fullname,
      Teknisi: item.teknisi?.fullname ?? "Belum ditugaskan",
      Status: item.status,
      Alasan: item.alasan,
    }));

    const buffer = createExcelFile({
      fileName: exportFileName("laporan-penugasan", q.dari, q.sampai),
      sheetName: "Data Penugasan",
      title: "Laporan Penugasan / SPK",
      exportedAt: new Date(),
      period: { dari: q.dari, sampai: q.sampai },
      summary: {
        "Total Penugasan": items.length,
        "Status Pending": per_status.pending,
        "Status Proses": per_status.proses,
        "Status Selesai": per_status.selesai,
        "Status Dibatalkan": per_status.dibatalkan,
      },
      columns: [
        "Nomor SPK",
        "Tanggal Penugasan",
        "ID Pelanggan PDAM",
        "Nama Pelanggan",
        "Alamat",
        "Kode Unit",
        "Nama Unit",
        "Dibuat Oleh",
        "Teknisi",
        "Status",
        "Alasan",
      ],
      rows,
    });

    return {
      buffer,
      fileName: exportFileName("laporan-penugasan", q.dari, q.sampai),
    };
  },

  async exportPenggantian(user: AuthUser, q: PenggantianQuery) {
    const id_unit = resolveUnit(user, q.id_unit);
    const where = buildPenggantianWhere(id_unit, q);
    const items = await laporanRepository.penggantianExport(where);

    const per_status_validasi = {
      belum_diajukan: 0,
      menunggu: 0,
      disetujui: 0,
      ditolak: 0,
    };

    for (const item of items) {
      per_status_validasi[item.status_validasi ?? "belum_diajukan"] += 1;
    }

    const rows = items.map((item) => ({
      "Nomor SPK": item.penugasan.nomor_spk,
      "ID Pelanggan PDAM": item.penugasan.pelanggan.id_pelanggan_pdam,
      "Nama Pelanggan": item.penugasan.pelanggan.nama,
      Alamat: item.penugasan.pelanggan.alamat,
      "Kode Unit": item.penugasan.unit.kode_unit,
      "Nama Unit": item.penugasan.unit.nama_unit,
      "Nomor Seri WM Lama": item.no_seri_wm_lama ?? "-",
      "Stand WM Lama": item.stand_wm_lama ?? "-",
      "Kondisi WM Lama": item.kondisi_fisik_wm_lama,
      "Nomor Seri WM Baru": item.no_seri_wm_baru ?? "-",
      "Stand Awal WM Baru": item.stand_awal_wm_baru ?? "-",
      "Merk WM Baru": item.merk
        ? `${item.merk.kode_wm} - ${item.merk.merk_wm}`
        : "-",
      "Tanggal Penggantian": formatDateTimeWib(item.tgl_penggantian),
      Teknisi: item.teknisi.fullname,
      "Tahap Penggantian": item.tahap_penggantian,
      "Status Validasi": item.status_validasi ?? "belum_diajukan",
      "Catatan Validasi": item.catatan_validasi ?? "-",
    }));

    const buffer = createExcelFile({
      fileName: exportFileName("laporan-penggantian-wm", q.dari, q.sampai),
      sheetName: "Data Penggantian",
      title: "Laporan Penggantian Water Meter",
      exportedAt: new Date(),
      period: { dari: q.dari, sampai: q.sampai },
      summary: {
        "Total Penggantian": items.length,
        "Belum Diajukan": per_status_validasi.belum_diajukan,
        Menunggu: per_status_validasi.menunggu,
        Disetujui: per_status_validasi.disetujui,
        Ditolak: per_status_validasi.ditolak,
      },
      columns: [
        "Nomor SPK",
        "ID Pelanggan PDAM",
        "Nama Pelanggan",
        "Alamat",
        "Kode Unit",
        "Nama Unit",
        "Nomor Seri WM Lama",
        "Stand WM Lama",
        "Kondisi WM Lama",
        "Nomor Seri WM Baru",
        "Stand Awal WM Baru",
        "Merk WM Baru",
        "Tanggal Penggantian",
        "Teknisi",
        "Tahap Penggantian",
        "Status Validasi",
        "Catatan Validasi",
      ],
      rows,
    });

    return {
      buffer,
      fileName: exportFileName("laporan-penggantian-wm", q.dari, q.sampai),
    };
  },
};
