import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

type PenugasanAccessScope = {
  id_unit?: number;
  id_teknisi?: number;
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

  findById(id: number, scope: PenugasanAccessScope = {}) {
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

  findPelangganById(id: number) {
    return prisma.pelanggan.findUnique({
      where: { id_pelanggan: id },
    });
  },

  findUnitById(id: number) {
    return prisma.unit.findUnique({
      where: { id_unit: id },
    });
  },

  findTeknisiById(id: number) {
    return prisma.user.findFirst({
      where: {
        id_user: id,
        role: "teknisi",
      },
    });
  },

  findPenggantianByPenugasanId(id: number) {
    return prisma.penggantianWm.findFirst({
      where: { id_penugasan: id },
      select: { id_penggantian: true },
    });
  },

  findActiveByPelangganId(idPelanggan: number) {
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
    id_pelanggan: number;
    id_unit: number;
    tgl_penugasan?: Date;
    alasan: string;
    id_user_penugasan: number;
    id_teknisi: number;
  }) {
    return prisma.penugasan.create({
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

  update(id: number, data: Prisma.PenugasanUncheckedUpdateInput) {
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

  delete(id: number) {
    return prisma.penugasan.delete({
      where: { id_penugasan: id },
    });
  },
};
