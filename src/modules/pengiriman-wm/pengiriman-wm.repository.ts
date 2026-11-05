import { prisma } from "../../lib/prisma";

const pengirimanSelect = {
  id_pengiriman: true,
  no_pengiriman: true,
  id_unit_tujuan: true,
  tgl_pengiriman: true,
  total_wm: true,
  catatan: true,
  id_user_pusat: true,
  created_at: true,

  unit_tujuan: {
    select: {
      id_unit: true,
      nama_unit: true,
    },
  },

  user_pusat: {
    select: {
      id_user: true,
      fullname: true,
      username: true,
    },
  },

  details: {
    select: {
      id_detail: true,
      id_merk: true,
      ukuran_dn: true,
      jumlah: true,

      merk: {
        select: {
          id_merk: true,
          merk_wm: true,
          wm_digit: true,
        },
      },
    },
  },
} as const;

type CreatePengirimanRepositoryInput = {
  no_pengiriman: string;
  id_unit_tujuan: string;
  tgl_pengiriman: Date;
  catatan?: string | null;
  id_user_pusat: string;
  details: {
    id_merk: string;
    ukuran_dn: string;
    jumlah: number;
  }[];
};

type UpdatePengirimanRepositoryInput = {
  no_pengiriman?: string;
  id_unit_tujuan?: string;
  tgl_pengiriman?: Date;
  catatan?: string | null;
};

export const pengirimanWmRepository = {
  findAll() {
    return prisma.pengirimanWm.findMany({
      select: pengirimanSelect,
      orderBy: { id_pengiriman: "desc" },
    });
  },

  findById(id_pengiriman: string) {
    return prisma.pengirimanWm.findUnique({
      where: { id_pengiriman },
      select: pengirimanSelect,
    });
  },

  findByNoPengiriman(no_pengiriman: string) {
    return prisma.pengirimanWm.findUnique({
      where: { no_pengiriman },
      select: { id_pengiriman: true },
    });
  },

  create(data: CreatePengirimanRepositoryInput) {
    const { details, ...pengirimanData } = data;

    return prisma.pengirimanWm.create({
      data: {
        ...pengirimanData,
        total_wm: details.reduce((total, item) => total + item.jumlah, 0),
        details: {
          create: details,
        },
      },
      select: pengirimanSelect,
    });
  },

  update(id_pengiriman: string, data: UpdatePengirimanRepositoryInput) {
    return prisma.pengirimanWm.update({
      where: { id_pengiriman },
      data,
      select: pengirimanSelect,
    });
  },

  delete(id_pengiriman: string) {
    return prisma.pengirimanWm.delete({
      where: { id_pengiriman },
      select: { id_pengiriman: true },
    });
  },
};
