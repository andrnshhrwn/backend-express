import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

import type { TolakBapInput, ValidasiQuery } from "./validasi.validator.js";

type ReadScope =
  | {
      id_user: string;
      role: "admin_pusat";
      id_unit: string | null;
    }
  | {
      id_user: string;
      role: "admin_cabang";
      id_unit: string;
    };

type AdminScope = {
  id_user: string;
  role: "admin_pusat";
  id_unit: string | null;
};

const validasiInclude = {
  penugasan: {
    include: {
      pelanggan: true,
      unit: true,
      teknisi: {
        select: {
          id_user: true,
          fullname: true,
          username: true,
          role: true,
        },
      },
    },
  },
  teknisi: {
    select: {
      id_user: true,
      fullname: true,
      username: true,
      role: true,
    },
  },
  merk: {
    select: {
      id_merk: true,
      kode_wm: true,
      merk_wm: true,
      wm_digit: true,
    },
  },
} satisfies Prisma.PenggantianWmInclude;

function scopeWhere(scope: ReadScope): Prisma.PenggantianWmWhereInput {
  if (scope.role === "admin_pusat") {
    return {};
  }

  return {
    penugasan: {
      is: {
        id_unit: scope.id_unit,
      },
    },
  };
}

function isBapComplete(bap: {
  tahap_penggantian: string;
  kondisi_fisik_wm_lama: string | null;
  id_merk: string | null;
  no_seri_wm_baru: string | null;
  stand_awal_wm_baru: number | null;
  path_image_wm_lama: string | null;
  path_image_wm_baru: string | null;
  tgl_penggantian: Date | null;
}): boolean {
  return (
    bap.tahap_penggantian === "menunggu_validasi" &&
    Boolean(bap.kondisi_fisik_wm_lama) &&
    Boolean(bap.id_merk) &&
    Boolean(bap.no_seri_wm_baru?.trim()) &&
    bap.stand_awal_wm_baru !== null &&
    bap.stand_awal_wm_baru !== undefined &&
    Boolean(bap.path_image_wm_lama?.trim()) &&
    Boolean(bap.path_image_wm_baru?.trim()) &&
    bap.tgl_penggantian !== null
  );
}

export const validasiRepository = {
  async findAll(filters: ValidasiQuery, scope: ReadScope) {
    const { page = 1, limit = 20, status_validasi } = filters;

    const where: Prisma.PenggantianWmWhereInput = {
      ...scopeWhere(scope),
      ...(status_validasi ? { status_validasi } : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.penggantianWm.findMany({
        where,
        include: validasiInclude,
        orderBy: [{ status_validasi: "asc" }, { tgl_penggantian: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.penggantianWm.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  findById(id: string, scope: ReadScope) {
    return prisma.penggantianWm.findFirst({
      where: {
        id_penggantian: id,
        ...scopeWhere(scope),
      },
      include: validasiInclude,
    });
  },

  async setujui(id: string) {
    return prisma.$transaction(async (tx) => {
      const initialBap = await tx.penggantianWm.findUnique({
        where: { id_penggantian: id },
        select: { id_penugasan: true },
      });

      if (!initialBap) {
        return { kind: "NOT_FOUND" as const };
      }

      const lockedPenugasan = await tx.$queryRaw<
        Array<{ id_penugasan: string }>
      >`
        SELECT id_penugasan
        FROM penugasan
        WHERE id_penugasan = ${initialBap.id_penugasan}
        FOR UPDATE
      `;

      if (lockedPenugasan.length === 0) {
        return { kind: "NOT_FOUND" as const };
      }

      const lockedBap = await tx.$queryRaw<Array<{ id_penggantian: string }>>`
        SELECT id_penggantian
        FROM penggantian_wm
        WHERE id_penggantian = ${id}
        FOR UPDATE
      `;

      if (lockedBap.length === 0) {
        return { kind: "NOT_FOUND" as const };
      }

      const bap = await tx.penggantianWm.findUnique({
        where: { id_penggantian: id },
        include: {
          penugasan: {
            include: {
              pelanggan: true,
              unit: true,
            },
          },
        },
      });

      if (!bap) {
        return { kind: "NOT_FOUND" as const };
      }

      if (bap.status_validasi !== "menunggu") {
        return { kind: "ALREADY_PROCESSED" as const };
      }

      if (bap.penugasan.status !== "selesai") {
        return { kind: "PENUGASAN_BELUM_SELESAI" as const };
      }

      if (!isBapComplete(bap)) {
        return { kind: "BAP_DATA_BELUM_LENGKAP" as const };
      }

      const approved = await tx.penggantianWm.findFirst({
        where: {
          id_penugasan: bap.id_penugasan,
          status_validasi: "disetujui",
          id_penggantian: { not: id },
        },
        select: { id_penggantian: true },
      });

      if (approved) {
        return { kind: "OTHER_BAP_APPROVED" as const };
      }

      await tx.pelanggan.update({
        where: {
          id_pelanggan: bap.penugasan.id_pelanggan,
        },
        data: {
          wm_no_seri_aktif: bap.no_seri_wm_baru,
        },
      });

      await tx.penggantianWm.update({
        where: { id_penggantian: id },
        data: {
          status_validasi: "disetujui",
          catatan_validasi: null,
        },
      });

      const data = await tx.penggantianWm.findUnique({
        where: { id_penggantian: id },
        include: validasiInclude,
      });

      return {
        kind: "APPROVED" as const,
        data,
      };
    });
  },

  async tolak(id: string, input: TolakBapInput) {
    return prisma.$transaction(async (tx) => {
      const initialBap = await tx.penggantianWm.findUnique({
        where: { id_penggantian: id },
        select: { id_penugasan: true },
      });

      if (!initialBap) {
        return { kind: "NOT_FOUND" as const };
      }

      const lockedPenugasan = await tx.$queryRaw<
        Array<{ id_penugasan: string }>
      >`
        SELECT id_penugasan
        FROM penugasan
        WHERE id_penugasan = ${initialBap.id_penugasan}
        FOR UPDATE
      `;

      if (lockedPenugasan.length === 0) {
        return { kind: "NOT_FOUND" as const };
      }

      const lockedBap = await tx.$queryRaw<Array<{ id_penggantian: string }>>`
        SELECT id_penggantian
        FROM penggantian_wm
        WHERE id_penggantian = ${id}
        FOR UPDATE
      `;

      if (lockedBap.length === 0) {
        return { kind: "NOT_FOUND" as const };
      }

      const bap = await tx.penggantianWm.findUnique({
        where: { id_penggantian: id },
        include: {
          penugasan: true,
        },
      });

      if (!bap) {
        return { kind: "NOT_FOUND" as const };
      }

      if (bap.status_validasi !== "menunggu") {
        return { kind: "ALREADY_PROCESSED" as const };
      }

      if (bap.penugasan.status !== "selesai") {
        return { kind: "PENUGASAN_BELUM_SELESAI" as const };
      }

      if (!isBapComplete(bap)) {
        return { kind: "BAP_DATA_BELUM_LENGKAP" as const };
      }

      const data = await tx.penggantianWm.update({
        where: { id_penggantian: id },
        data: {
          status_validasi: "ditolak",
          catatan_validasi: input.catatan_validasi,
        },
        include: validasiInclude,
      });

      return {
        kind: "REJECTED" as const,
        data,
      };
    });
  },
};
