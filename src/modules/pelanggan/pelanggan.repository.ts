import { prisma } from "../../lib/prisma";

export const pelangganRepository = {
  findAll() {
    return prisma.pelanggan.findMany({
      orderBy: {
        id_pelanggan: "asc",
      },
      include: {
        unit: true,
        tarif: true,
      },
    });
  },

  findById(id_pelanggan: number) {
    return prisma.pelanggan.findUnique({
      where: {
        id_pelanggan,
      },
      include: {
        unit: true,
        tarif: true,
      },
    });
  },

  findByPdamId(id_pelanggan_pdam: string) {
    return prisma.pelanggan.findUnique({
      where: {
        id_pelanggan_pdam,
      },
    });
  },

  create(data: {
    id_pelanggan_pdam: string;
    id_unit: number;
    nama: string;
    alamat: string;
    id_tarif: string;
    wm_no_seri_aktif?: string | null;
  }) {
    return prisma.pelanggan.create({
      data,
      include: {
        unit: true,
        tarif: true,
      },
    });
  },

  update(
    id_pelanggan: number,
    data: {
      id_pelanggan_pdam?: string;
      id_unit?: number;
      nama?: string;
      alamat?: string;
      id_tarif?: string;
      wm_no_seri_aktif?: string | null;
    },
  ) {
    return prisma.pelanggan.update({
      where: {
        id_pelanggan,
      },
      data,
      include: {
        unit: true,
        tarif: true,
      },
    });
  },

  async hasRelations(id_pelanggan: number): Promise<boolean> {
    const count = await prisma.penugasan.count({
      where: {
        id_pelanggan,
      },
    });

    return count > 0;
  },

  delete(id_pelanggan: number) {
    return prisma.pelanggan.delete({
      where: {
        id_pelanggan,
      },
    });
  },
};
