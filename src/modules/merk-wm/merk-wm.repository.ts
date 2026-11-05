import { prisma } from "../../lib/prisma";

export const merkWmRepository = {
  findAll() {
    return prisma.merkWm.findMany({
      orderBy: { id_merk: "asc" },
    });
  },

  findById(id_merk: string) {
    return prisma.merkWm.findUnique({
      where: { id_merk },
    });
  },

  findByCode(kode_wm: string) {
    return prisma.merkWm.findUnique({
      where: { kode_wm },
    });
  },

  findByName(merk_wm: string) {
    return prisma.merkWm.findFirst({
      where: { merk_wm },
    });
  },

  create(data: { kode_wm: string; merk_wm: string; wm_digit: number }) {
    return prisma.merkWm.create({ data });
  },

  update(
    id_merk: string,
    data: {
      kode_wm: string;
      merk_wm: string;
      wm_digit: number;
    },
  ) {
    return prisma.merkWm.update({
      where: { id_merk },
      data,
    });
  },

  hasRelations(id_merk: string) {
    return prisma.pengirimanWmDetail
      .count({
        where: { id_merk },
      })
      .then((count) => count > 0);
  },

  delete(id_merk: string) {
    return prisma.merkWm.delete({
      where: { id_merk },
    });
  },
};
