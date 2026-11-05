import { prisma } from "../../lib/prisma";

export const tipeTarifRepository = {
  findAll() {
    return prisma.tipeTarif.findMany({
      orderBy: { kode_tarif: "asc" },
      include: {
        _count: {
          select: {
            pelanggan: true,
          },
        },
      },
    });
  },

  findById(id_tarif: string) {
    return prisma.tipeTarif.findUnique({
      where: { id_tarif },
    });
  },

  findByCode(kode_tarif: string) {
    return prisma.tipeTarif.findUnique({
      where: { kode_tarif },
    });
  },

  findByName(nama_tarif: string) {
    return prisma.tipeTarif.findFirst({
      where: { nama_tarif },
    });
  },

  create(data: { kode_tarif: string; nama_tarif: string }) {
    return prisma.tipeTarif.create({ data });
  },

  update(id_tarif: string, data: { kode_tarif: string; nama_tarif: string }) {
    return prisma.tipeTarif.update({
      where: { id_tarif },
      data,
    });
  },

  async hasRelations(id_tarif: string): Promise<boolean> {
    const count = await prisma.pelanggan.count({
      where: { id_tarif },
    });

    return count > 0;
  },

  delete(id_tarif: string) {
    return prisma.tipeTarif.delete({
      where: { id_tarif },
    });
  },
};
