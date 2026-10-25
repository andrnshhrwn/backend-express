import { prisma } from "../../lib/prisma";

export const merkWmRepository = {
  findAll() {
    return prisma.merkWm.findMany({
      orderBy: { id_merk: "asc" },
    });
  },

  findById(id_merk: number) {
    return prisma.merkWm.findUnique({
      where: { id_merk },
    });
  },

  findByName(merk_wm: string) {
    return prisma.merkWm.findFirst({
      where: { merk_wm },
    });
  },

  create(data: { merk_wm: string; wm_digit: number }) {
    return prisma.merkWm.create({ data });
  },

  update(id_merk: number, data: { merk_wm: string; wm_digit: number }) {
    return prisma.merkWm.update({
      where: { id_merk },
      data,
    });
  },

  hasRelations(id_merk: number) {
    return prisma.pengirimanWmDetail
      .count({
        where: { id_merk },
      })
      .then((count) => count > 0);
  },

  delete(id_merk: number) {
    return prisma.merkWm.delete({
      where: { id_merk },
    });
  },
};
