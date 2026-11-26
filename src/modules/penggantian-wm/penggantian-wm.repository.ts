import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

import type {
  SubmitDataWmLamaInput,
  SelesaikanPenggantianWmInput,
  PerbaikiPenggantianWmInput,
  ListPenggantianWmQuery,
} from "./penggantian-wm.validator.js";

type PenggantianWmAccessScope = {
  id_unit?: string;
  id_teknisi?: string;
};

type StokWmRow = {
  id_unit: string;
  kode_unit: string;
  nama_unit: string;
  id_merk: string;
  kode_wm: string;
  merk_wm: string;
  wm_digit: number;
  total_dikirim: number;
  total_terpasang: number;
  stok_tersedia: number;
};

const detailInclude = {
  penugasan: {
    include: {
      pelanggan: true,
      unit: true,
      teknisi: {
        select: {
          id_user: true,
          fullname: true,
          username: true,
          role: true,
        },
      },
    },
  },
  teknisi: {
    select: {
      id_user: true,
      fullname: true,
      username: true,
      role: true,
    },
  },
  merk: {
    select: {
      id_merk: true,
      kode_wm: true,
      merk_wm: true,
      wm_digit: true,
    },
  },
} satisfies Prisma.PenggantianWmInclude;

/**
 * Membandingkan nomor seri tanpa terpengaruh spasi
 * di awal/akhir dan perbedaan huruf besar/kecil.
 */
function normalizeSerialNumber(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

/**
 * Memeriksa apakah nomor seri WM lama dan baru sama.
 */
function isSameSerialNumber(
  oldSerial: string | null | undefined,
  newSerial: string | null | undefined,
): boolean {
  const normalizedOld = normalizeSerialNumber(oldSerial);
  const normalizedNew = normalizeSerialNumber(newSerial);

  return (
    normalizedOld !== "" &&
    normalizedNew !== "" &&
    normalizedOld === normalizedNew
  );
}

/**
 * Memeriksa apakah nomor seri WM baru sudah digunakan
 * oleh BAP lain.
 *
 * BAP yang sedang diproses dikecualikan.
 */
async function isNewSerialAlreadyUsed(
  tx: Prisma.TransactionClient,
  serialNumber: string,
  currentBapId: string,
): Promise<boolean> {
  const existing = await tx.penggantianWm.findFirst({
    where: {
      no_seri_wm_baru: serialNumber,
      id_penggantian: {
        not: currentBapId,
      },
    },
    select: {
      id_penggantian: true,
    },
  });

  return existing !== null;
}

/**
 * Memeriksa kelengkapan seluruh data wajib BAP.
 *
 * Nomor seri WM lama dan stand WM lama boleh null.
 * Merek WM baru wajib dipilih sebelum BAP diajukan.
 */
function isBapComplete(bap: {
  tahap_penggantian: string;
  kondisi_fisik_wm_lama: string | null;
  id_merk: string | null;
  no_seri_wm_baru: string | null;
  stand_awal_wm_baru: number | null;
  path_image_wm_lama: string | null;
  path_image_wm_baru: string | null;
  tgl_penggantian: Date | null;
}): boolean {
  return (
    bap.tahap_penggantian === "menunggu_validasi" &&
    Boolean(bap.kondisi_fisik_wm_lama) &&
    Boolean(bap.id_merk) &&
    Boolean(bap.no_seri_wm_baru?.trim()) &&
    bap.stand_awal_wm_baru !== null &&
    bap.stand_awal_wm_baru !== undefined &&
    Boolean(bap.path_image_wm_lama?.trim()) &&
    Boolean(bap.path_image_wm_baru?.trim()) &&
    bap.tgl_penggantian !== null
  );
}

/**
 * Menghitung stok merek WM pada suatu unit.
 *
 * Stok tersedia = total WM yang dikirim - total WM terpasang.
 *
 * WM terpasang dihitung dari BAP yang sudah masuk tahap
 * menunggu_validasi, tanpa membedakan status validasinya.
 */
async function hitungStokWm(
  tx: Prisma.TransactionClient,
  idUnit: string,
  idMerk: string,
) {
  const [pengiriman, jumlahTerpasang] = await Promise.all([
    tx.pengirimanWmDetail.aggregate({
      where: {
        id_merk: idMerk,
        pengiriman: {
          is: {
            id_unit_tujuan: idUnit,
          },
        },
      },
      _sum: {
        jumlah: true,
      },
    }),

    tx.penggantianWm.count({
      where: {
        id_merk: idMerk,
        tahap_penggantian: "menunggu_validasi",
        penugasan: {
          is: {
            id_unit: idUnit,
          },
        },
      },
    }),
  ]);

  const totalDikirim = pengiriman._sum.jumlah ?? 0;
  const stokTersedia = totalDikirim - jumlahTerpasang;

  return {
    totalDikirim,
    jumlahTerpasang,
    stokTersedia,
  };
}

export const penggantianWmRepository = {
  // ===================================================
  // RINGKASAN STOK WM
  // ===================================================

  async findStok(scope: PenggantianWmAccessScope) {
    const shipmentWhere: Prisma.PengirimanWmDetailWhereInput =
      scope.id_unit !== undefined
        ? {
            pengiriman: {
              is: {
                id_unit_tujuan: scope.id_unit,
              },
            },
          }
        : {};

    const bapWhere: Prisma.PenggantianWmWhereInput = {
      tahap_penggantian: "menunggu_validasi",
      id_merk: {
        not: null,
      },
      ...(scope.id_unit !== undefined
        ? {
            penugasan: {
              is: {
                id_unit: scope.id_unit,
              },
            },
          }
        : {}),
    };

    const [pengirimanDetails, bapTerpasang] = await Promise.all([
      prisma.pengirimanWmDetail.findMany({
        where: shipmentWhere,
        select: {
          id_merk: true,
          jumlah: true,
          merk: {
            select: {
              id_merk: true,
              kode_wm: true,
              merk_wm: true,
              wm_digit: true,
            },
          },
          pengiriman: {
            select: {
              id_unit_tujuan: true,
              unit_tujuan: {
                select: {
                  id_unit: true,
                  kode_unit: true,
                  nama_unit: true,
                },
              },
            },
          },
        },
      }),

      prisma.penggantianWm.findMany({
        where: bapWhere,
        select: {
          id_merk: true,
          merk: {
            select: {
              id_merk: true,
              kode_wm: true,
              merk_wm: true,
              wm_digit: true,
            },
          },
          penugasan: {
            select: {
              id_unit: true,
              unit: {
                select: {
                  id_unit: true,
                  kode_unit: true,
                  nama_unit: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const stokMap = new Map<string, StokWmRow>();

    const getOrCreateRow = (
      unit: {
        id_unit: string;
        kode_unit: string;
        nama_unit: string;
      },
      merk: {
        id_merk: string;
        kode_wm: string;
        merk_wm: string;
        wm_digit: number;
      },
    ): StokWmRow => {
      const key = `${unit.id_unit}:${merk.id_merk}`;

      let row = stokMap.get(key);

      if (!row) {
        row = {
          id_unit: unit.id_unit,
          kode_unit: unit.kode_unit,
          nama_unit: unit.nama_unit,
          id_merk: merk.id_merk,
          kode_wm: merk.kode_wm,
          merk_wm: merk.merk_wm,
          wm_digit: merk.wm_digit,
          total_dikirim: 0,
          total_terpasang: 0,
          stok_tersedia: 0,
        };

        stokMap.set(key, row);
      }

      return row;
    };

    // Akumulasi jumlah WM yang dikirim ke setiap unit dan merek.
    for (const detail of pengirimanDetails) {
      const row = getOrCreateRow(detail.pengiriman.unit_tujuan, detail.merk);

      row.total_dikirim += detail.jumlah;
    }

    // Akumulasi pemasangan berdasarkan BAP yang sudah selesai dipasang.
    // Status validasi tidak menjadi filter perhitungan.
    for (const bap of bapTerpasang) {
      if (!bap.id_merk || !bap.merk) {
        continue;
      }

      const row = getOrCreateRow(bap.penugasan.unit, bap.merk);

      row.total_terpasang += 1;
    }

    const data = Array.from(stokMap.values())
      .map((row) => ({
        ...row,
        stok_tersedia: row.total_dikirim - row.total_terpasang,
      }))
      .sort((a, b) => {
        const unitComparison = a.nama_unit.localeCompare(b.nama_unit);

        if (unitComparison !== 0) {
          return unitComparison;
        }

        return a.merk_wm.localeCompare(b.merk_wm);
      });

    const summary = data.reduce(
      (total, row) => ({
        total_dikirim: total.total_dikirim + row.total_dikirim,
        total_terpasang: total.total_terpasang + row.total_terpasang,
        stok_tersedia: total.stok_tersedia + row.stok_tersedia,
      }),
      {
        total_dikirim: 0,
        total_terpasang: 0,
        stok_tersedia: 0,
      },
    );

    return {
      data,
      summary,
    };
  },

  // ===================================================
  // DAFTAR BAP
  // ===================================================

  async findAll(
    filters: ListPenggantianWmQuery,
    scope: PenggantianWmAccessScope,
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const { id_penugasan, status_validasi } = filters;

    const where: Prisma.PenggantianWmWhereInput = {
      ...(id_penugasan !== undefined ? { id_penugasan } : {}),
      ...(status_validasi !== undefined ? { status_validasi } : {}),

      ...(scope.id_unit !== undefined
        ? {
            penugasan: {
              is: {
                id_unit: scope.id_unit,
              },
            },
          }
        : {}),

      ...(scope.id_teknisi !== undefined
        ? {
            id_teknisi: scope.id_teknisi,
          }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.penggantianWm.findMany({
        where,
        include: detailInclude,
        orderBy: {
          tgl_penggantian: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.penggantianWm.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  findById(id: string, scope: PenggantianWmAccessScope) {
    return prisma.penggantianWm.findFirst({
      where: {
        id_penggantian: id,

        ...(scope.id_unit !== undefined
          ? {
              penugasan: {
                is: {
                  id_unit: scope.id_unit,
                },
              },
            }
          : {}),

        ...(scope.id_teknisi !== undefined
          ? {
              id_teknisi: scope.id_teknisi,
            }
          : {}),
      },
      include: detailInclude,
    });
  },

  // ===================================================
  // TAHAP 1: SIMPAN DATA WM LAMA
  // ===================================================

  async submitDataWmLama(
    idPenugasan: string,
    input: SubmitDataWmLamaInput,
    pathImageWmLama: string,
    idTeknisi: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id_penugasan: string }>>`
        SELECT id_penugasan
        FROM penugasan
        WHERE id_penugasan = ${idPenugasan}
        FOR UPDATE
      `;

      if (locked.length === 0) {
        return { kind: "PENUGASAN_NOT_FOUND" as const };
      }

      const penugasan = await tx.penugasan.findUnique({
        where: {
          id_penugasan: idPenugasan,
        },
        select: {
          id_penugasan: true,
          id_teknisi: true,
          status: true,
        },
      });

      if (!penugasan) {
        return { kind: "PENUGASAN_NOT_FOUND" as const };
      }

      if (penugasan.id_teknisi !== idTeknisi) {
        return { kind: "FORBIDDEN_TEKNISI" as const };
      }

      if (penugasan.status !== "pending") {
        return { kind: "PENUGASAN_TIDAK_PENDING" as const };
      }

      const existing = await tx.penggantianWm.findFirst({
        where: {
          id_penugasan: idPenugasan,
        },
        select: {
          id_penggantian: true,
        },
      });

      if (existing) {
        return { kind: "BAP_ALREADY_EXISTS" as const };
      }

      if (input.no_seri_wm_lama) {
        const existingSerial = await tx.penggantianWm.findFirst({
          where: {
            OR: [
              {
                no_seri_wm_lama: input.no_seri_wm_lama,
              },
              {
                no_seri_wm_baru: input.no_seri_wm_lama,
              },
            ],
          },
          select: {
            id_penggantian: true,
          },
        });

        if (existingSerial) {
          return { kind: "NO_SERI_WM_SUDAH_DIGUNAKAN" as const };
        }
      }

      const data = await tx.penggantianWm.create({
        data: {
          id_penugasan: idPenugasan,
          no_seri_wm_lama: input.no_seri_wm_lama ?? null,
          stand_wm_lama: input.stand_wm_lama ?? null,
          kondisi_fisik_wm_lama: input.kondisi_fisik_wm_lama,
          path_image_wm_lama: pathImageWmLama,

          id_teknisi: idTeknisi,

          tahap_penggantian: "data_wm_lama",
          status_validasi: null,
        },
        include: detailInclude,
      });

      await tx.penugasan.update({
        where: {
          id_penugasan: idPenugasan,
        },
        data: {
          status: "proses",
        },
      });

      return {
        kind: "CREATED" as const,
        data,
      };
    });
  },

  // ===================================================
  // TAHAP 2: SELESAIKAN PEMASANGAN WM BARU
  // ===================================================

  async selesaikan(
    idPenggantian: string,
    input: SelesaikanPenggantianWmInput,
    pathImageWmBaru: string,
    idTeknisi: string,
  ) {
    return prisma.$transaction(
      async (tx) => {
        const initialBap = await tx.penggantianWm.findUnique({
          where: {
            id_penggantian: idPenggantian,
          },
          select: {
            id_penggantian: true,
            id_penugasan: true,
          },
        });

        if (!initialBap) {
          return { kind: "BAP_NOT_FOUND" as const };
        }

        // Kunci SPK agar dua proses pada SPK yang sama tidak berjalan bersamaan.
        const lockedPenugasan = await tx.$queryRaw<
          Array<{ id_penugasan: string }>
        >`
          SELECT id_penugasan
          FROM penugasan
          WHERE id_penugasan = ${initialBap.id_penugasan}
          FOR UPDATE
        `;

        if (lockedPenugasan.length === 0) {
          return { kind: "PENUGASAN_NOT_FOUND" as const };
        }

        const bap = await tx.penggantianWm.findUnique({
          where: {
            id_penggantian: idPenggantian,
          },
        });

        if (!bap) {
          return { kind: "BAP_NOT_FOUND" as const };
        }

        const penugasan = await tx.penugasan.findUnique({
          where: {
            id_penugasan: bap.id_penugasan,
          },
          select: {
            id_penugasan: true,
            id_unit: true,
            id_teknisi: true,
            status: true,
          },
        });

        if (!penugasan) {
          return { kind: "PENUGASAN_NOT_FOUND" as const };
        }

        if (
          bap.id_teknisi !== idTeknisi ||
          penugasan.id_teknisi !== idTeknisi
        ) {
          return { kind: "FORBIDDEN_TEKNISI" as const };
        }

        if (bap.tahap_penggantian !== "data_wm_lama") {
          return { kind: "BAP_TAHAP_TIDAK_VALID" as const };
        }

        if (penugasan.status !== "proses") {
          return { kind: "PENUGASAN_TIDAK_PROSES" as const };
        }

        // Periksa keberadaan merek WM.
        const merk = await tx.merkWm.findUnique({
          where: {
            id_merk: input.id_merk,
          },
          select: {
            id_merk: true,
          },
        });

        if (!merk) {
          return { kind: "MERK_WM_NOT_FOUND" as const };
        }

        // Kunci unit agar pemakaian stok oleh teknisi lain pada unit
        // yang sama dilakukan secara bergantian.
        const lockedUnit = await tx.$queryRaw<Array<{ id_unit: string }>>`
          SELECT id_unit
          FROM unit
          WHERE id_unit = ${penugasan.id_unit}
          FOR UPDATE
        `;

        if (lockedUnit.length === 0) {
          return { kind: "UNIT_NOT_FOUND" as const };
        }

        // Nomor seri WM baru tidak boleh sama dengan WM lama.
        if (isSameSerialNumber(bap.no_seri_wm_lama, input.no_seri_wm_baru)) {
          return { kind: "NO_SERI_WM_SAMA" as const };
        }

        // Nomor seri WM baru tidak boleh dipakai BAP lain.
        const serialAlreadyUsed = await isNewSerialAlreadyUsed(
          tx,
          input.no_seri_wm_baru,
          idPenggantian,
        );

        if (serialAlreadyUsed) {
          return {
            kind: "NO_SERI_WM_BARU_ALREADY_EXISTS" as const,
          };
        }

        // Bentuk data BAP sebelum disimpan.
        const candidateBap = {
          tahap_penggantian: "menunggu_validasi",
          kondisi_fisik_wm_lama: bap.kondisi_fisik_wm_lama,
          id_merk: input.id_merk,
          no_seri_wm_baru: input.no_seri_wm_baru,
          stand_awal_wm_baru: input.stand_awal_wm_baru,
          path_image_wm_lama: bap.path_image_wm_lama,
          path_image_wm_baru: pathImageWmBaru,
          tgl_penggantian: input.tgl_penggantian,
        };

        if (!isBapComplete(candidateBap)) {
          return { kind: "BAP_DATA_BELUM_LENGKAP" as const };
        }

        // Hitung stok setelah unit berhasil dikunci.
        const stok = await hitungStokWm(tx, penugasan.id_unit, input.id_merk);

        if (stok.stokTersedia < 1) {
          return { kind: "STOK_WM_TIDAK_CUKUP" as const };
        }

        // Simpan merek dan data WM baru.
        // BAP yang masuk tahap ini langsung dihitung sebagai WM terpakai.
        const data = await tx.penggantianWm.update({
          where: {
            id_penggantian: idPenggantian,
          },
          data: {
            id_merk: input.id_merk,
            no_seri_wm_baru: input.no_seri_wm_baru,
            stand_awal_wm_baru: input.stand_awal_wm_baru,
            path_image_wm_baru: pathImageWmBaru,
            tgl_penggantian: input.tgl_penggantian,

            tahap_penggantian: "menunggu_validasi",
            status_validasi: "menunggu",
          },
          include: detailInclude,
        });

        await tx.penugasan.update({
          where: {
            id_penugasan: bap.id_penugasan,
          },
          data: {
            status: "selesai",
          },
        });

        return {
          kind: "COMPLETED" as const,
          data,
        };
      },
      {
        isolationLevel: "ReadCommitted",
      },
    );
  },

  // ===================================================
  // PERBAIKAN BAP YANG DITOLAK
  // ===================================================

  async perbaiki(
    idPenggantian: string,
    input: PerbaikiPenggantianWmInput,
    pathImageWmLama: string | undefined,
    pathImageWmBaru: string | undefined,
    idTeknisi: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const initialBap = await tx.penggantianWm.findUnique({
        where: {
          id_penggantian: idPenggantian,
        },
        select: {
          id_penggantian: true,
          id_penugasan: true,
        },
      });

      if (!initialBap) {
        return { kind: "BAP_NOT_FOUND" as const };
      }

      const lockedPenugasan = await tx.$queryRaw<
        Array<{ id_penugasan: string }>
      >`
        SELECT id_penugasan
        FROM penugasan
        WHERE id_penugasan = ${initialBap.id_penugasan}
        FOR UPDATE
      `;

      if (lockedPenugasan.length === 0) {
        return { kind: "PENUGASAN_NOT_FOUND" as const };
      }

      const lockedBap = await tx.$queryRaw<Array<{ id_penggantian: string }>>`
        SELECT id_penggantian
        FROM penggantian_wm
        WHERE id_penggantian = ${idPenggantian}
        FOR UPDATE
      `;

      if (lockedBap.length === 0) {
        return { kind: "BAP_NOT_FOUND" as const };
      }

      const bap = await tx.penggantianWm.findUnique({
        where: {
          id_penggantian: idPenggantian,
        },
      });

      if (!bap) {
        return { kind: "BAP_NOT_FOUND" as const };
      }

      const penugasan = await tx.penugasan.findUnique({
        where: {
          id_penugasan: bap.id_penugasan,
        },
        select: {
          id_penugasan: true,
          id_teknisi: true,
          status: true,
        },
      });

      if (!penugasan) {
        return { kind: "PENUGASAN_NOT_FOUND" as const };
      }

      if (bap.id_teknisi !== idTeknisi || penugasan.id_teknisi !== idTeknisi) {
        return { kind: "FORBIDDEN_TEKNISI" as const };
      }

      if (bap.status_validasi !== "ditolak") {
        return { kind: "BAP_NOT_REJECTED" as const };
      }

      if (bap.tahap_penggantian !== "menunggu_validasi") {
        return { kind: "BAP_TAHAP_TIDAK_VALID" as const };
      }

      if (penugasan.status !== "selesai") {
        return { kind: "PENUGASAN_TIDAK_SELESAI" as const };
      }

      const candidateBap = {
        tahap_penggantian: bap.tahap_penggantian,
        kondisi_fisik_wm_lama:
          input.kondisi_fisik_wm_lama ?? bap.kondisi_fisik_wm_lama,
        id_merk: bap.id_merk,
        no_seri_wm_lama:
          input.no_seri_wm_lama !== undefined
            ? input.no_seri_wm_lama
            : bap.no_seri_wm_lama,
        no_seri_wm_baru: input.no_seri_wm_baru ?? bap.no_seri_wm_baru,
        stand_awal_wm_baru: input.stand_awal_wm_baru ?? bap.stand_awal_wm_baru,
        path_image_wm_lama: pathImageWmLama ?? bap.path_image_wm_lama,
        path_image_wm_baru: pathImageWmBaru ?? bap.path_image_wm_baru,
        tgl_penggantian: input.tgl_penggantian ?? bap.tgl_penggantian,
      };

      if (
        isSameSerialNumber(
          candidateBap.no_seri_wm_lama,
          candidateBap.no_seri_wm_baru,
        )
      ) {
        return { kind: "NO_SERI_WM_SAMA" as const };
      }

      if (candidateBap.no_seri_wm_baru) {
        const serialAlreadyUsed = await isNewSerialAlreadyUsed(
          tx,
          candidateBap.no_seri_wm_baru,
          idPenggantian,
        );

        if (serialAlreadyUsed) {
          return {
            kind: "NO_SERI_WM_BARU_ALREADY_EXISTS" as const,
          };
        }
      }

      if (!isBapComplete(candidateBap)) {
        return { kind: "BAP_DATA_BELUM_LENGKAP" as const };
      }

      const oldImagePaths = [
        ...(pathImageWmLama && bap.path_image_wm_lama
          ? [bap.path_image_wm_lama]
          : []),
        ...(pathImageWmBaru && bap.path_image_wm_baru
          ? [bap.path_image_wm_baru]
          : []),
      ];

      const data = await tx.penggantianWm.update({
        where: {
          id_penggantian: idPenggantian,
        },
        data: {
          ...(input.no_seri_wm_lama !== undefined
            ? { no_seri_wm_lama: input.no_seri_wm_lama }
            : {}),

          ...(input.stand_wm_lama !== undefined
            ? { stand_wm_lama: input.stand_wm_lama }
            : {}),

          ...(input.kondisi_fisik_wm_lama !== undefined
            ? { kondisi_fisik_wm_lama: input.kondisi_fisik_wm_lama }
            : {}),

          ...(input.no_seri_wm_baru !== undefined
            ? { no_seri_wm_baru: input.no_seri_wm_baru }
            : {}),

          ...(input.stand_awal_wm_baru !== undefined
            ? { stand_awal_wm_baru: input.stand_awal_wm_baru }
            : {}),

          ...(input.tgl_penggantian !== undefined
            ? { tgl_penggantian: input.tgl_penggantian }
            : {}),

          ...(pathImageWmLama !== undefined
            ? { path_image_wm_lama: pathImageWmLama }
            : {}),

          ...(pathImageWmBaru !== undefined
            ? { path_image_wm_baru: pathImageWmBaru }
            : {}),

          status_validasi: "menunggu",
          catatan_validasi: null,
        },
        include: detailInclude,
      });

      return {
        kind: "UPDATED" as const,
        data,
        oldImagePaths,
      };
    });
  },
};
