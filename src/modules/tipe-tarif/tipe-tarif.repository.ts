import { prisma } from "../../lib/prisma";

export const tipeTarifRepository = {
  findAll() {
    return prisma.tipeTarif.findMany({
      orderBy: { id_tarif: "asc" },
    });
  },

  findById(id_tarif: string) {
    return prisma.tipeTarif.findUnique({
      where: { id_tarif },
    });
  },

  findByName(nama_tarif: string) {
    return prisma.tipeTarif.findFirst({
      where: { nama_tarif },
    });
  },

  create(data: { id_tarif: string; nama_tarif: string }) {
    return prisma.tipeTarif.create({ data });
  },

  update(id_tarif: string, data: { nama_tarif: string }) {
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
