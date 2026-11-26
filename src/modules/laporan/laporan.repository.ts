import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

export const laporanRepository = {
  async pengiriman(
    where: Prisma.PengirimanWmWhereInput,
    skip: number,
    take: number,
  ) {
    const [items, total, agg] = await Promise.all([
      prisma.pengirimanWm.findMany({
        where,
        skip,
        take,
        orderBy: [{ tgl_pengiriman: "desc" }, { created_at: "desc" }],
        include: {
          unit_tujuan: { select: { kode_unit: true, nama_unit: true } },
          user_pencatat: { select: { fullname: true } },
          details: {
            include: {
              merk: { select: { kode_wm: true, merk_wm: true } },
            },
          },
        },
      }),
      prisma.pengirimanWm.count({ where }),
      prisma.pengirimanWm.aggregate({
        where,
        _sum: { total_wm: true },
      }),
    ]);

    return { items, total, totalWm: agg._sum.total_wm ?? 0 };
  },

  async pengirimanExport(where: Prisma.PengirimanWmWhereInput) {
    return prisma.pengirimanWm.findMany({
      where,
      orderBy: [{ tgl_pengiriman: "desc" }, { created_at: "desc" }],
      include: {
        unit_tujuan: { select: { kode_unit: true, nama_unit: true } },
        user_pencatat: { select: { fullname: true } },
        details: {
          include: {
            merk: { select: { kode_wm: true, merk_wm: true } },
          },
        },
      },
    });
  },

  async penugasan(
    where: Prisma.PenugasanWhereInput,
    skip: number,
    take: number,
  ) {
    const [items, total, grouped] = await Promise.all([
      prisma.penugasan.findMany({
        where,
        skip,
        take,
        orderBy: { tgl_penugasan: "desc" },
        include: {
          pelanggan: {
            select: {
              id_pelanggan_pdam: true,
              nama: true,
              alamat: true,
            },
          },
          unit: { select: { kode_unit: true, nama_unit: true } },
          pembuat: { select: { fullname: true } },
          teknisi: { select: { fullname: true } },
        },
      }),
      prisma.penugasan.count({ where }),
      prisma.penugasan.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
    ]);

    return { items, total, grouped };
  },

  async penugasanExport(where: Prisma.PenugasanWhereInput) {
    return prisma.penugasan.findMany({
      where,
      orderBy: { tgl_penugasan: "desc" },
      include: {
        pelanggan: {
          select: {
            id_pelanggan_pdam: true,
            nama: true,
            alamat: true,
          },
        },
        unit: { select: { kode_unit: true, nama_unit: true } },
        pembuat: { select: { fullname: true } },
        teknisi: { select: { fullname: true } },
      },
    });
  },

  async penggantian(
    where: Prisma.PenggantianWmWhereInput,
    skip: number,
    take: number,
  ) {
    const [items, total, grouped] = await Promise.all([
      prisma.penggantianWm.findMany({
        where,
        skip,
        take,
        orderBy: [{ tgl_penggantian: "desc" }, { id_penggantian: "desc" }],
        include: {
          penugasan: {
            select: {
              nomor_spk: true,
              pelanggan: {
                select: {
                  id_pelanggan_pdam: true,
                  nama: true,
                  alamat: true,
                },
              },
              unit: { select: { kode_unit: true, nama_unit: true } },
            },
          },
          teknisi: { select: { fullname: true } },
          merk: { select: { kode_wm: true, merk_wm: true } },
        },
      }),
      prisma.penggantianWm.count({ where }),
      prisma.penggantianWm.groupBy({
        by: ["status_validasi"],
        where,
        _count: { _all: true },
      }),
    ]);

    return { items, total, grouped };
  },

  async penggantianExport(where: Prisma.PenggantianWmWhereInput) {
    return prisma.penggantianWm.findMany({
      where,
      orderBy: [{ tgl_penggantian: "desc" }, { id_penggantian: "desc" }],
      include: {
        penugasan: {
          select: {
            nomor_spk: true,
            pelanggan: {
              select: {
                id_pelanggan_pdam: true,
                nama: true,
                alamat: true,
              },
            },
            unit: { select: { kode_unit: true, nama_unit: true } },
          },
        },
        teknisi: { select: { fullname: true } },
        merk: { select: { kode_wm: true, merk_wm: true } },
      },
    });
  },
};
