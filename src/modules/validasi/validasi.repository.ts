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
  id_user: string;
  role: "admin_pusat";
  id_unit: string | null;
};

function scopeWhere(_scope: AdminScope): Prisma.PenggantianWmWhereInput {
  // Admin Pusat memiliki akses monitoring seluruh unit.
  return {};
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

  findById(id: string, scope: AdminScope) {
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
      /*
       * Ambil relasi SPK terlebih dahulu.
       * Belum melakukan perubahan data pada tahap ini.
       */
      const initialBap = await tx.penggantianWm.findUnique({
        where: { id_penggantian: id },
        select: { id_penugasan: true },
      });

      if (!initialBap) {
        return { kind: "NOT_FOUND" as const };
      }

      /*
       * Kunci baris SPK terlebih dahulu.
       * BAP lain yang terkait SPK yang sama harus menunggu
       * transaksi ini selesai.
       */
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

      /*
       * Setelah SPK terkunci, kunci baris BAP.
       */
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

      if (
        bap.penugasan.status === "selesai" ||
        bap.penugasan.status === "dibatalkan"
      ) {
        return { kind: "PENUGASAN_INACTIVE" as const };
      }

      /*
       * Pastikan SPK belum memiliki BAP lain yang disetujui.
       * Pemeriksaan dilakukan setelah baris SPK dikunci.
       */
      const approved = await tx.penggantianWm.findFirst({
        where: {
          id_penugasan: bap.id_penugasan,
          status_validasi: "disetujui",
          id_penggantian: { not: id },
        },
        select: {
          id_penggantian: true,
        },
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
        where: {
          id_penugasan: bap.id_penugasan,
        },
        data: {
          status: "selesai",
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

      /*
       * Kunci SPK terlebih dahulu agar proses penolakan
       * terserialisasi dengan proses persetujuan pada SPK sama.
       */
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

      return {
        kind: "REJECTED" as const,
        data,
      };
    });
  },
};
