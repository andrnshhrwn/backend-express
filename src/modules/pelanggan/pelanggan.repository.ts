import { prisma } from "../../lib/prisma";

type CreatePelangganData = {
  id_pelanggan_pdam: string;
  id_unit: string;
  nama: string;
  alamat: string;
  id_tarif: string;
  wm_no_seri_aktif?: string | null;
};

type UpdatePelangganData = Partial<CreatePelangganData>;

export const pelangganRepository = {
  findAll() {
    return prisma.pelanggan.findMany({
      orderBy: {
        nama: "asc",
      },
      include: {
        unit: true,
        tarif: true,
      },
    });
  },

  findById(id_pelanggan: string) {
    return prisma.pelanggan.findUnique({
      where: { id_pelanggan },
      include: {
        unit: true,
        tarif: true,
      },
    });
  },

  findByPdamId(id_pelanggan_pdam: string) {
    return prisma.pelanggan.findUnique({
      where: { id_pelanggan_pdam },
    });
  },

  create(data: CreatePelangganData) {
    return prisma.pelanggan.create({
      data,
      include: {
        unit: true,
        tarif: true,
      },
    });
  },

  update(id_pelanggan: string, data: UpdatePelangganData) {
    return prisma.pelanggan.update({
      where: { id_pelanggan },
      data,
      include: {
        unit: true,
        tarif: true,
      },
    });
  },

  async hasRelations(id_pelanggan: string): Promise<boolean> {
    const count = await prisma.penugasan.count({
      where: { id_pelanggan },
    });

    return count > 0;
  },

  delete(id_pelanggan: string) {
    return prisma.pelanggan.delete({
      where: { id_pelanggan },
    });
  },
};
