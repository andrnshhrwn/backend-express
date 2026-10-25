import { prisma } from "../../lib/prisma";

export const unitRepository = {
  findAll() {
    return prisma.unit.findMany({
      orderBy: { id_unit: "asc" },
    });
  },

  findById(id_unit: number) {
    return prisma.unit.findUnique({
      where: { id_unit },
    });
  },

  create(nama_unit: string) {
    return prisma.unit.create({
      data: { nama_unit },
    });
  },

  update(id_unit: number, nama_unit: string) {
    return prisma.unit.update({
      where: { id_unit },
      data: { nama_unit },
    });
  },

  async hasRelations(id_unit: number): Promise<boolean> {
    const [users, pengiriman, pelanggan, penugasan] = await Promise.all([
      prisma.user.count({
        where: { id_unit },
      }),
      prisma.pengirimanWm.count({
        where: { id_unit_tujuan: id_unit },
      }),
      prisma.pelanggan.count({
        where: { id_unit },
      }),
      prisma.penugasan.count({
        where: { id_unit },
      }),
    ]);

    return users > 0 || pengiriman > 0 || pelanggan > 0 || penugasan > 0;
  },

  delete(id_unit: number) {
    return prisma.unit.delete({
      where: { id_unit },
    });
  },
};
