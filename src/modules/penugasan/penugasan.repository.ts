import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

type PenugasanAccessScope = {
  id_unit?: string;
  id_teknisi?: string;
};

export const penugasanRepository = {
  findAll(scope: PenugasanAccessScope = {}) {
    return prisma.penugasan.findMany({
      where: {
        ...(scope.id_unit !== undefined ? { id_unit: scope.id_unit } : {}),
        ...(scope.id_teknisi !== undefined
          ? { id_teknisi: scope.id_teknisi }
          : {}),
      },
      orderBy: { id_penugasan: "desc" },
      include: {
        pelanggan: true,
        unit: true,
        pembuat: {
          select: {
            id_user: true,
            fullname: true,
            username: true,
          },
        },
        teknisi: {
          select: {
            id_user: true,
            fullname: true,
            username: true,
          },
        },
      },
    });
  },

  findById(id: string, scope: PenugasanAccessScope = {}) {
    return prisma.penugasan.findFirst({
      where: {
        id_penugasan: id,
        ...(scope.id_unit !== undefined ? { id_unit: scope.id_unit } : {}),
        ...(scope.id_teknisi !== undefined
          ? { id_teknisi: scope.id_teknisi }
          : {}),
      },
      include: {
        pelanggan: true,
        unit: true,
        pembuat: {
          select: {
            id_user: true,
            fullname: true,
            username: true,
          },
        },
        teknisi: {
          select: {
            id_user: true,
            fullname: true,
            username: true,
          },
        },
      },
    });
  },

  findPelangganById(id: string) {
    return prisma.pelanggan.findUnique({
      where: { id_pelanggan: id },
    });
  },

  findUnitById(id: string) {
    return prisma.unit.findUnique({
      where: { id_unit: id },
    });
  },

  findTeknisiById(id: string, idUnit: string) {
    return prisma.user.findFirst({
      where: {
        id_user: id,
        id_unit: idUnit,
        role: "teknisi",
      },
    });
  },

  findPenggantianByPenugasanId(id: string) {
    return prisma.penggantianWm.findFirst({
      where: { id_penugasan: id },
      select: { id_penggantian: true },
    });
  },

  findActiveByPelangganId(idPelanggan: string) {
    return prisma.penugasan.findFirst({
      where: {
        id_pelanggan: idPelanggan,
        status: {
          in: ["pending", "proses"],
        },
      },
      select: {
        id_penugasan: true,
        status: true,
      },
    });
  },

  create(data: {
    nomor_spk: string;
    id_pelanggan: string;
    id_unit: string;
    tgl_penugasan?: Date;
    alasan: string;
    id_user_penugasan: string;
  }) {
    return prisma.penugasan.create({
      data: {
        ...data,
        status: "pending",
      },
      include: {
        pelanggan: true,
        unit: true,
        pembuat: {
          select: {
            id_user: true,
            fullname: true,
          },
        },
        teknisi: {
          select: {
            id_user: true,
            fullname: true,
          },
        },
      },
    });
  },

  update(id: string, data: Prisma.PenugasanUncheckedUpdateInput) {
    return prisma.penugasan.update({
      where: { id_penugasan: id },
      data,
      include: {
        pelanggan: true,
        unit: true,
        teknisi: {
          select: {
            id_user: true,
            fullname: true,
          },
        },
      },
    });
  },

  delete(id: string) {
    return prisma.penugasan.delete({
      where: { id_penugasan: id },
    });
  },

  async assignTeknisi(id: string, idTeknisi: string) {
    return prisma.penugasan.update({
      where: { id_penugasan: id },
      data: { id_teknisi: idTeknisi },
      include: {
        pelanggan: true,
        unit: true,
        teknisi: {
          select: {
            id_user: true,
            fullname: true,
            username: true,
          },
        },
      },
    });
  },

  async getNextSpkSequence(tanggal: string): Promise<number> {
    const sequence = await prisma.spkSequence.upsert({
      where: {
        tanggal,
      },
      create: {
        tanggal,
        last_number: 1,
      },
      update: {
        last_number: {
          increment: 1,
        },
      },
      select: {
        last_number: true,
      },
    });

    return sequence.last_number;
  },
};
