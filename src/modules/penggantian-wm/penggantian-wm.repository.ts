import { prisma } from "../../lib/prisma";
import type {
  CreatePenggantianWmInput,
  ListPenggantianWmQuery,
} from "./penggantian-wm.validator";

type PenggantianWmAccessScope = {
  id_unit?: number;
  id_teknisi?: number;
};

const detailInclude = {
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
} as const;

export const penggantianWmRepository = {
  async findAll(
    filters: ListPenggantianWmQuery,
    scope: PenggantianWmAccessScope,
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const { id_penugasan, status_validasi } = filters;

    const where = {
      ...(id_penugasan !== undefined ? { id_penugasan } : {}),
      ...(status_validasi ? { status_validasi } : {}),
      ...(scope.id_unit !== undefined
        ? { penugasan: { is: { id_unit: scope.id_unit } } }
        : {}),
      ...(scope.id_teknisi !== undefined
        ? { id_teknisi: scope.id_teknisi }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.penggantianWm.findMany({
        where,
        include: detailInclude,
        orderBy: { tgl_penggantian: "desc" },
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

  findById(id: number, scope: PenggantianWmAccessScope) {
    return prisma.penggantianWm.findFirst({
      where: {
        id_penggantian: id,
        ...(scope.id_unit !== undefined
          ? { penugasan: { is: { id_unit: scope.id_unit } } }
          : {}),
        ...(scope.id_teknisi !== undefined
          ? { id_teknisi: scope.id_teknisi }
          : {}),
      },
      include: detailInclude,
    });
  },

  findPenugasanById(id: number) {
    return prisma.penugasan.findUnique({
      where: { id_penugasan: id },
      include: {
        pelanggan: true,
        unit: true,
      },
    });
  },

  async findExistingSubmission(idPenugasan: number) {
    return prisma.penggantianWm.findMany({
      where: { id_penugasan: idPenugasan },
      select: {
        id_penggantian: true,
        status_validasi: true,
      },
    });
  },

  async create(input: CreatePenggantianWmInput, idTeknisi: number) {
    return prisma.$transaction(async (tx) => {
      // Kunci baris SPK agar pembuatan BAP untuk SPK yang sama
      // diserialisasi oleh database.
      const locked = await tx.$queryRaw<Array<{ id_penugasan: number }>>`
        SELECT id_penugasan
        FROM penugasan
        WHERE id_penugasan = ${input.id_penugasan}
        FOR UPDATE
      `;

      if (locked.length === 0) {
        return { kind: "PENUGASAN_NOT_FOUND" as const };
      }

      const penugasan = await tx.penugasan.findUnique({
        where: { id_penugasan: input.id_penugasan },
        select: {
          id_penugasan: true,
          id_teknisi: true,
          status: true,
        },
      });

      if (!penugasan) {
        return { kind: "PENUGASAN_NOT_FOUND" as const };
      }

      if (penugasan.id_teknisi !== idTeknisi) {
        return { kind: "FORBIDDEN_TEKNISI" as const };
      }

      if (penugasan.status === "selesai" || penugasan.status === "dibatalkan") {
        return { kind: "PENUGASAN_TIDAK_AKTIF" as const };
      }

      const existing = await tx.penggantianWm.findMany({
        where: { id_penugasan: input.id_penugasan },
        select: { status_validasi: true },
      });

      if (existing.some((item) => item.status_validasi === "menunggu")) {
        return { kind: "BAP_MENUNGGU" as const };
      }

      if (existing.some((item) => item.status_validasi === "disetujui")) {
        return { kind: "BAP_SUDAH_DISETUJUI" as const };
      }

      const data = await tx.penggantianWm.create({
        data: {
          id_penugasan: input.id_penugasan,
          no_seri_wm_lama: input.no_seri_wm_lama ?? null,
          stand_wm_lama: input.stand_wm_lama ?? null,
          kondisi_fisik_wm_lama: input.kondisi_fisik_wm_lama,
          path_image_wm_lama: input.path_image_wm_lama ?? null,
          no_seri_wm_baru: input.no_seri_wm_baru,
          stand_awal_wm_baru: input.stand_awal_wm_baru,
          path_image_wm_baru: input.path_image_wm_baru,
          id_teknisi: idTeknisi,
          tgl_penggantian: input.tgl_penggantian,
          status_validasi: "menunggu",
        },
        include: detailInclude,
      });

      // SPK mulai dikerjakan jika sebelumnya masih pending.
      if (penugasan.status === "pending") {
        await tx.penugasan.update({
          where: { id_penugasan: input.id_penugasan },
          data: { status: "proses" },
        });
      }

      return { kind: "CREATED" as const, data };
    });
  },
};
