import type { Prisma } from "../../generated/prisma/client";
import { AppError } from "../../shared/errors/app-error";
import type { AuthUser } from "../../middlewares/authenticate";
import { laporanRepository } from "./laporan.repository";

interface BaseQuery {
  dari?: string;
  sampai?: string;
  id_unit?: string;
  page: number;
  limit: number;
}

// Kolom @db.Date: bandingkan sebagai tanggal UTC
function dateOnlyRange(dari?: string, sampai?: string) {
  if (!dari && !sampai) return undefined;
  return {
    ...(dari ? { gte: new Date(`${dari}T00:00:00.000Z`) } : {}),
    ...(sampai ? { lte: new Date(`${sampai}T00:00:00.000Z`) } : {}),
  };
}

// Kolom DateTime: batas hari mengikuti WIB (UTC+7)
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

// admin_cabang dikunci ke unit sendiri; pusat dan pimpinan bebas memilih unit
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

export const laporanService = {
  async pengiriman(user: AuthUser, q: BaseQuery) {
    const id_unit = resolveUnit(user, q.id_unit);
    const p = paging(q);

    const where: Prisma.PengirimanWmWhereInput = {
      ...(id_unit ? { id_unit_tujuan: id_unit } : {}),
      ...(q.dari || q.sampai
        ? { tgl_pengiriman: dateOnlyRange(q.dari, q.sampai) }
        : {}),
    };

    const { items, total, totalWm } = await laporanRepository.pengiriman(
      where,
      p.skip,
      p.take,
    );

    return {
      data: {
        items,
        summary: { total_pengiriman: total, total_wm: totalWm },
      },
      meta: p.meta(total),
    };
  },

  async penugasan(
    user: AuthUser,
    q: BaseQuery & {
      status?: "pending" | "proses" | "selesai" | "dibatalkan";
      id_teknisi?: string;
    },
  ) {
    const id_unit = resolveUnit(user, q.id_unit);
    const p = paging(q);

    const where: Prisma.PenugasanWhereInput = {
      ...(id_unit ? { id_unit } : {}),
      ...(q.status ? { status: q.status } : {}),
      ...(q.id_teknisi ? { id_teknisi: q.id_teknisi } : {}),
      ...(q.dari || q.sampai
        ? { tgl_penugasan: dateTimeRange(q.dari, q.sampai) }
        : {}),
    };

    const { items, total, grouped } = await laporanRepository.penugasan(
      where,
      p.skip,
      p.take,
    );

    const per_status = { pending: 0, proses: 0, selesai: 0, dibatalkan: 0 };
    for (const g of grouped) per_status[g.status] = g._count._all;

    return {
      data: { items, summary: { total, per_status } },
      meta: p.meta(total),
    };
  },

  async penggantian(
    user: AuthUser,
    q: BaseQuery & {
      status_validasi?: "menunggu" | "disetujui" | "ditolak";
      tahap_penggantian?: "data_wm_lama" | "menunggu_validasi";
    },
  ) {
    const id_unit = resolveUnit(user, q.id_unit);
    const p = paging(q);

    const where: Prisma.PenggantianWmWhereInput = {
      ...(id_unit ? { penugasan: { id_unit } } : {}),
      ...(q.status_validasi ? { status_validasi: q.status_validasi } : {}),
      ...(q.tahap_penggantian
        ? { tahap_penggantian: q.tahap_penggantian }
        : {}),
      ...(q.dari || q.sampai
        ? { tgl_penggantian: dateTimeRange(q.dari, q.sampai) }
        : {}),
    };

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
};
