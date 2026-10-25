import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import type { TolakBapInput, ValidasiQuery } from "./validasi.validator";

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
} satisfies Prisma.PenggantianWmInclude;

type AdminScope = {
  role: "admin_pusat" | "admin_cabang";
  id_unit: number | null;
};

function scopeWhere(scope: AdminScope) {
  if (scope.role === "admin_pusat") return {};

  if (scope.id_unit === null) {
    return { id_penggantian: -1 };
  }

  return {
    penugasan: {
      id_unit: scope.id_unit,
    },
  };
}

export const validasiRepository = {
  async findAll(filters: ValidasiQuery, scope: AdminScope) {
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

  findById(id: number, scope: AdminScope) {
    return prisma.penggantianWm.findFirst({
      where: {
        id_penggantian: id,
        ...scopeWhere(scope),
      },
      include: validasiInclude,
    });
  },

  async setujui(id: number, scope: AdminScope) {
    return prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id_penggantian: number }>>`
        SELECT id_penggantian
        FROM penggantian_wm
        WHERE id_penggantian = ${id}
        FOR UPDATE
      `;

      if (locked.length === 0) {
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

      if (!bap) return { kind: "NOT_FOUND" as const };

      if (
        scope.role === "admin_cabang" &&
        (scope.id_unit === null || bap.penugasan.id_unit !== scope.id_unit)
      ) {
        return { kind: "NOT_FOUND" as const };
      }

      if (bap.status_validasi !== "menunggu") {
        return { kind: "ALREADY_PROCESSED" as const };
      }

      if (
        bap.penugasan.status === "selesai" ||
        bap.penugasan.status === "dibatalkan"
      ) {
        return { kind: "PENUGASAN_INACTIVE" as const };
      }

      // Pastikan tidak ada BAP lain yang sudah disetujui.
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

      await tx.penggantianWm.update({
        where: { id_penggantian: id },
        data: {
          status_validasi: "disetujui",
          catatan_validasi: null,
        },
      });

      await tx.pelanggan.update({
        where: {
          id_pelanggan: bap.penugasan.id_pelanggan,
        },
        data: {
          wm_no_seri_aktif: bap.no_seri_wm_baru,
        },
      });

      await tx.penugasan.update({
        where: { id_penugasan: bap.id_penugasan },
        data: { status: "selesai" },
      });

      const data = await tx.penggantianWm.findUnique({
        where: { id_penggantian: id },
        include: validasiInclude,
      });

      return { kind: "APPROVED" as const, data };
    });
  },

  async tolak(id: number, input: TolakBapInput, scope: AdminScope) {
    return prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id_penggantian: number }>>`
        SELECT id_penggantian
        FROM penggantian_wm
        WHERE id_penggantian = ${id}
        FOR UPDATE
      `;

      if (locked.length === 0) {
        return { kind: "NOT_FOUND" as const };
      }

      const bap = await tx.penggantianWm.findUnique({
        where: { id_penggantian: id },
        include: { penugasan: true },
      });

      if (!bap) return { kind: "NOT_FOUND" as const };

      if (
        scope.role === "admin_cabang" &&
        (scope.id_unit === null || bap.penugasan.id_unit !== scope.id_unit)
      ) {
        return { kind: "NOT_FOUND" as const };
      }

      if (bap.status_validasi !== "menunggu") {
        return { kind: "ALREADY_PROCESSED" as const };
      }

      if (
        bap.penugasan.status === "selesai" ||
        bap.penugasan.status === "dibatalkan"
      ) {
        return { kind: "PENUGASAN_INACTIVE" as const };
      }

      const data = await tx.penggantianWm.update({
        where: { id_penggantian: id },
        data: {
          status_validasi: "ditolak",
          catatan_validasi: input.catatan_validasi,
        },
        include: validasiInclude,
      });

      return { kind: "REJECTED" as const, data };
    });
  },
};
