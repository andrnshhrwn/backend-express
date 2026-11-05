import { prisma } from "../../lib/prisma";

type DashboardScope = {
  id_unit?: string;
  id_teknisi?: string;
};

export const dashboardRepository = {
  async getSummary(scope: DashboardScope, startDate: Date, endDate: Date) {
    const penugasanWhere = {
      ...scope,
      tgl_penugasan: {
        gte: startDate,
        lt: endDate,
      },
    };

    const [
      totalPenugasan,
      groupedStatuses,
      totalPenggantian,
      groupedValidasi,
      totalPelanggan,
      totalPengiriman,
    ] = await Promise.all([
      prisma.penugasan.count({
        where: penugasanWhere,
      }),

      prisma.penugasan.groupBy({
        by: ["status"],
        where: penugasanWhere,
        _count: {
          _all: true,
        },
      }),

      prisma.penggantianWm.count({
        where: {
          tgl_penggantian: {
            gte: startDate,
            lt: endDate,
          },
          penugasan: {
            is: scope,
          },
        },
      }),

      prisma.penggantianWm.groupBy({
        by: ["status_validasi"],
        where: {
          tgl_penggantian: {
            gte: startDate,
            lt: endDate,
          },
          penugasan: {
            is: scope,
          },
        },
        _count: {
          _all: true,
        },
      }),

      prisma.pelanggan.count({
        where: scope.id_unit
          ? {
              id_unit: scope.id_unit,
            }
          : scope.id_teknisi
            ? {
                penugasan: {
                  some: {
                    id_teknisi: scope.id_teknisi,
                  },
                },
              }
            : {},
      }),

      // Teknisi tidak mendapatkan total pengiriman seluruh unit.
      scope.id_teknisi
        ? Promise.resolve([])
        : prisma.pengirimanWm.findMany({
            where: {
              tgl_pengiriman: {
                gte: startDate,
                lt: endDate,
              },
              ...(scope.id_unit ? { id_unit_tujuan: scope.id_unit } : {}),
            },
            select: {
              total_wm: true,
            },
          }),
    ]);

    const statusCount = Object.fromEntries(
      groupedStatuses.map((item) => [item.status, item._count._all]),
    );

    const validasiCount = Object.fromEntries(
      groupedValidasi.map((item) => [item.status_validasi, item._count._all]),
    );

    return {
      periode: String(startDate.getFullYear()),

      total_pelanggan: totalPelanggan,

      spk: {
        total: totalPenugasan,
        pending: statusCount.pending ?? 0,
        proses: statusCount.proses ?? 0,
        selesai: statusCount.selesai ?? 0,
        dibatalkan: statusCount.dibatalkan ?? 0,
      },

      penggantian_wm: {
        total: totalPenggantian,
        menunggu: validasiCount.menunggu ?? 0,
        disetujui: validasiCount.disetujui ?? 0,
        ditolak: validasiCount.ditolak ?? 0,
      },

      pengiriman_wm: {
        total_wm_dikirim: totalPengiriman.reduce(
          (total, item) => total + item.total_wm,
          0,
        ),
      },

      target_tahunan: null,
      persentase_realisasi: null,
    };
  },

  async getUnitProgress(scope: DashboardScope, startDate: Date, endDate: Date) {
    const unitWhere = scope.id_unit
      ? {
          id_unit: scope.id_unit,
        }
      : scope.id_teknisi
        ? {
            penugasan: {
              some: {
                id_teknisi: scope.id_teknisi,
              },
            },
          }
        : {};

    const [units, groupedAssignments] = await Promise.all([
      prisma.unit.findMany({
        where: unitWhere,
        select: {
          id_unit: true,
          nama_unit: true,
        },
        orderBy: {
          nama_unit: "asc",
        },
      }),

      prisma.penugasan.groupBy({
        by: ["id_unit"],
        where: {
          ...scope,
          tgl_penugasan: {
            gte: startDate,
            lt: endDate,
          },
          status: "selesai",
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const completedByUnit = new Map(
      groupedAssignments.map((item) => [item.id_unit, item._count._all]),
    );

    return units.map((unit) => ({
      id_unit: unit.id_unit,
      nama_unit: unit.nama_unit,
      target: null,
      realisasi: completedByUnit.get(unit.id_unit) ?? 0,
      persentase: null,
    }));
  },
};
