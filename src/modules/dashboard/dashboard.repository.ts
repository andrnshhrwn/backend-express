import { prisma } from "../../lib/prisma";

type DashboardScope = {
  id_unit?: string;
  id_teknisi?: string;
};

type DashboardPeriod = {
  periode: string;
  startDate: Date;
  endDate: Date;
};

function getCustomerWhere(scope: DashboardScope) {
  if (scope.id_unit) {
    return {
      id_unit: scope.id_unit,
    };
  }

  if (scope.id_teknisi) {
    return {
      penugasan: {
        some: {
          id_teknisi: scope.id_teknisi,
        },
      },
    };
  }

  return {};
}

function getPenugasanRelationWhere(scope: DashboardScope) {
  if (scope.id_unit) {
    return {
      penugasan: {
        is: {
          id_unit: scope.id_unit,
        },
      },
    };
  }

  if (scope.id_teknisi) {
    return {
      penugasan: {
        is: {
          id_teknisi: scope.id_teknisi,
        },
      },
    };
  }

  return {};
}

export const dashboardRepository = {
  async getSummary(scope: DashboardScope, period: DashboardPeriod) {
    const { periode, startDate, endDate } = period;

    const penugasanWhere = {
      ...scope,
      tgl_penugasan: {
        gte: startDate,
        lt: endDate,
      },
    };

    const penggantianRelationWhere = getPenugasanRelationWhere(scope);

    const penggantianPeriodWhere = {
      tgl_penggantian: {
        gte: startDate,
        lt: endDate,
      },
      ...penggantianRelationWhere,
    };

    const customerWhere = getCustomerWhere(scope);

    const [
      totalPenugasan,
      groupedStatuses,
      totalPenggantian,
      groupedValidasi,
      totalWmDicabut,
      totalPelanggan,
      totalWmTerpasang,
      totalPengirimanBulanan,
      totalPengirimanKumulatif,
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
        where: penggantianPeriodWhere,
      }),

      prisma.penggantianWm.groupBy({
        by: ["status_validasi"],
        where: penggantianPeriodWhere,
        _count: {
          _all: true,
        },
      }),

      // Pencabutan fisik dihitung tanpa melihat status validasi.
      prisma.penggantianWm.count({
        where: {
          ...penggantianPeriodWhere,
          no_seri_wm_lama: {
            not: null,
          },
        },
      }),

      prisma.pelanggan.count({
        where: customerWhere,
      }),

      prisma.pelanggan.count({
        where: {
          ...customerWhere,
          wm_no_seri_aktif: {
            not: null,
          },
        },
      }),

      // Pengiriman pada bulan yang dipilih.
      scope.id_teknisi
        ? Promise.resolve({ _sum: { total_wm: 0 } })
        : prisma.pengirimanWm.aggregate({
            where: {
              tgl_pengiriman: {
                gte: startDate,
                lt: endDate,
              },
              ...(scope.id_unit ? { id_unit_tujuan: scope.id_unit } : {}),
            },
            _sum: {
              total_wm: true,
            },
          }),

      // Akumulasi seluruh pengiriman untuk estimasi posisi stok saat ini.
      scope.id_teknisi
        ? Promise.resolve({ _sum: { total_wm: 0 } })
        : prisma.pengirimanWm.aggregate({
            where: scope.id_unit
              ? {
                  id_unit_tujuan: scope.id_unit,
                }
              : {},
            _sum: {
              total_wm: true,
            },
          }),
    ]);

    const statusCount = Object.fromEntries(
      groupedStatuses.map((item) => [item.status, item._count._all]),
    );

    const validasiCount = Object.fromEntries(
      groupedValidasi.map((item) => [
        item.status_validasi ?? "null",
        item._count._all,
      ]),
    );

    const wmDikirimBulanan = totalPengirimanBulanan._sum.total_wm ?? 0;

    const wmDikirimKumulatif = totalPengirimanKumulatif._sum.total_wm ?? 0;

    const wmStok = wmDikirimKumulatif - totalWmTerpasang;

    const persentaseWmTerpasang =
      wmDikirimKumulatif > 0
        ? Number(((totalWmTerpasang / wmDikirimKumulatif) * 100).toFixed(2))
        : 0;

    const persentaseWmStok =
      wmDikirimKumulatif > 0
        ? Number(((wmStok / wmDikirimKumulatif) * 100).toFixed(2))
        : 0;

    return {
      periode,

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
        total_wm_dikirim: wmDikirimBulanan,
      },

      inventori: {
        total_wm_dikirim: wmDikirimKumulatif,
        wm_terpasang_aktif: totalWmTerpasang,
        wm_stok: wmStok,
        wm_dicabut: totalWmDicabut,
        persentase_wm_terpasang: persentaseWmTerpasang,
        persentase_wm_stok: persentaseWmStok,
      },

      target_bulanan: null,
      persentase_realisasi: null,
    };
  },

  async getUnitProgress(scope: DashboardScope, period: DashboardPeriod) {
    const { startDate, endDate } = period;

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

    const penugasanWhere = {
      ...scope,
      tgl_penugasan: {
        gte: startDate,
        lt: endDate,
      },
    };

    const [units, approvedBaps] = await Promise.all([
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

      // Realisasi berdasarkan BAP yang disetujui, bukan status SPK selesai.
      prisma.penggantianWm.findMany({
        where: {
          tgl_penggantian: {
            gte: startDate,
            lt: endDate,
          },
          status_validasi: "disetujui",
          ...getPenugasanRelationWhere(scope),
        },
        select: {
          penugasan: {
            select: {
              id_unit: true,
            },
          },
        },
      }),
    ]);

    const approvedByUnit = new Map<string, number>();

    for (const bap of approvedBaps) {
      const idUnit = bap.penugasan.id_unit;

      approvedByUnit.set(idUnit, (approvedByUnit.get(idUnit) ?? 0) + 1);
    }

    return units.map((unit) => ({
      id_unit: unit.id_unit,
      nama_unit: unit.nama_unit,
      target: null,
      realisasi: approvedByUnit.get(unit.id_unit) ?? 0,
      persentase: null,
    }));
  },
};
