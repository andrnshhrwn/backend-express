import * as XLSX from "xlsx";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../shared/errors/app-error";
import {
  importPelangganRowSchema,
  type ImportPelangganRow,
  type ConfirmImportPelangganInput,
} from "./import-pelanggan.validator";

type RowError = {
  row: number;
  field: string;
  message: string;
};

type ParsedRow = {
  rowNumber: number;
  data: ImportPelangganRow;
};

type ReadyRow = ParsedRow & {
  id_unit: string;
  id_tarif: string;
};

type SkippedRow = {
  row: number;
  column: string;
  id_pelanggan_pdam: string;
  reason: string;
};

type DatabaseClient = typeof prisma | Prisma.TransactionClient;

/**
 * Merapikan nama pelanggan.
 *
 * Aturan:
 * - Menghapus spasi di awal dan akhir.
 * - Mengubah spasi berulang menjadi satu spasi.
 * - Menggabungkan rangkaian minimal 4 huruf tunggal.
 * - Mempertahankan kapitalisasi dan tanda baca.
 */
function normalizePersonName(value: string): string {
  const tokens = value.normalize("NFC").trim().split(/\s+/u).filter(Boolean);

  const normalizedTokens: string[] = [];
  let index = 0;

  while (index < tokens.length) {
    const currentToken = tokens[index];

    if (!/^\p{L}$/u.test(currentToken)) {
      normalizedTokens.push(currentToken);
      index++;
      continue;
    }

    const letterSequence: string[] = [];

    while (index < tokens.length && /^\p{L}$/u.test(tokens[index])) {
      letterSequence.push(tokens[index]);
      index++;
    }

    if (letterSequence.length >= 3) {
      normalizedTokens.push(letterSequence.join(""));
    } else {
      normalizedTokens.push(...letterSequence);
    }
  }

  return normalizedTokens
    .join(" ")
    .toLocaleLowerCase("id-ID")
    .replace(
      /(^|[\s'-])(\p{L})/gu,
      (_, separator, letter) => separator + letter.toLocaleUpperCase("id-ID"),
    );
}

function parseExcel(buffer: Buffer) {
  let workbook: XLSX.WorkBook;

  try {
    workbook = XLSX.read(buffer, {
      type: "buffer",
      cellDates: false,
    });
  } catch {
    throw new AppError(400, "INVALID_EXCEL", "File Excel tidak dapat dibaca.");
  }

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new AppError(400, "EMPTY_EXCEL", "Sheet Excel kosong.");
  }

  const sheet = workbook.Sheets[sheetName];

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (rawRows.length === 0) {
    throw new AppError(400, "EMPTY_EXCEL", "Tidak ada data untuk diimpor.");
  }

  if (rawRows.length > 5000) {
    throw new AppError(
      400,
      "TOO_MANY_ROWS",
      "Maksimal 5.000 baris data per impor.",
    );
  }

  return rawRows;
}

function normalizeRows(rawRows: Record<string, unknown>[]) {
  const rows: ParsedRow[] = [];
  const errors: RowError[] = [];

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2;
    const result = importPelangganRowSchema.safeParse(raw);

    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          row: rowNumber,
          field: issue.path.join("."),
          message: issue.message,
        });
      }

      return;
    }

    rows.push({
      rowNumber,
      data: {
        ...result.data,
        nama: normalizePersonName(result.data.nama),
      },
    });
  });

  return { rows, errors };
}

async function validateRows(rows: ParsedRow[], db: DatabaseClient = prisma) {
  const errors: RowError[] = [];
  const skipped: SkippedRow[] = [];
  const seen = new Map<string, number>();

  // Periksa duplikat ID Pelanggan PDAM dalam file.
  for (const item of rows) {
    const customerNumber = item.data.id_pelanggan_pdam;
    const previousRow = seen.get(customerNumber);

    if (previousRow !== undefined) {
      skipped.push({
        row: item.rowNumber,
        column: "id_pelanggan_pdam",
        id_pelanggan_pdam: customerNumber,
        reason: `ID Pelanggan PDAM duplikat dengan baris ${previousRow} dalam file.`,
      });
    } else {
      seen.set(customerNumber, item.rowNumber);
    }
  }

  const uniqueRows = rows.filter(
    (item) => seen.get(item.data.id_pelanggan_pdam) === item.rowNumber,
  );

  const customerNumbers = uniqueRows.map((item) => item.data.id_pelanggan_pdam);

  const unitCodes = [...new Set(uniqueRows.map((item) => item.data.kode_unit))];

  const tariffCodes = [
    ...new Set(uniqueRows.map((item) => item.data.kode_tarif)),
  ];

  const [existingCustomers, units, tariffs] = await Promise.all([
    customerNumbers.length
      ? db.pelanggan.findMany({
          where: {
            id_pelanggan_pdam: {
              in: customerNumbers,
            },
          },
          select: {
            id_pelanggan_pdam: true,
          },
        })
      : Promise.resolve([]),

    unitCodes.length
      ? db.unit.findMany({
          where: {
            kode_unit: {
              in: unitCodes,
            },
          },
          select: {
            id_unit: true,
            kode_unit: true,
          },
        })
      : Promise.resolve([]),

    tariffCodes.length
      ? db.tipeTarif.findMany({
          where: {
            kode_tarif: {
              in: tariffCodes,
            },
          },
          select: {
            id_tarif: true,
            kode_tarif: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const existingNumbers = new Set(
    existingCustomers.map((item) => item.id_pelanggan_pdam),
  );

  const unitIdByCode = new Map(
    units.map((item) => [item.kode_unit, item.id_unit]),
  );

  const tariffIdByCode = new Map(
    tariffs.map((item) => [item.kode_tarif, item.id_tarif]),
  );

  const readyRows: ReadyRow[] = [];

  for (const item of uniqueRows) {
    const row = item.data;

    if (existingNumbers.has(row.id_pelanggan_pdam)) {
      skipped.push({
        row: item.rowNumber,
        column: "id_pelanggan_pdam",
        id_pelanggan_pdam: row.id_pelanggan_pdam,
        reason: "ID Pelanggan PDAM sudah terdaftar.",
      });

      continue;
    }

    const idUnit = unitIdByCode.get(row.kode_unit);
    const idTarif = tariffIdByCode.get(row.kode_tarif);

    let invalid = false;

    if (!idUnit) {
      errors.push({
        row: item.rowNumber,
        field: "kode_unit",
        message: `Kode unit ${row.kode_unit} tidak ditemukan.`,
      });

      invalid = true;
    }

    if (!idTarif) {
      errors.push({
        row: item.rowNumber,
        field: "kode_tarif",
        message: `Kode tarif ${row.kode_tarif} tidak ditemukan.`,
      });

      invalid = true;
    }

    if (!invalid && idUnit && idTarif) {
      readyRows.push({
        ...item,
        id_unit: idUnit,
        id_tarif: idTarif,
      });
    }
  }

  return {
    readyRows,
    skipped,
    errors,
  };
}

export const importPelangganService = {
  async preview(buffer: Buffer) {
    const rawRows = parseExcel(buffer);
    const normalized = normalizeRows(rawRows);

    const checked = await validateRows(normalized.rows);

    const errors = [...normalized.errors, ...checked.errors];

    const invalidRows = new Set(errors.map((item) => item.row));
    const skippedRows = new Set(checked.skipped.map((item) => item.row));

    return {
      total_rows: rawRows.length,
      valid_rows: checked.readyRows.length,
      skipped_rows: skippedRows.size,
      invalid_rows: invalidRows.size,
      can_import: checked.readyRows.length > 0,

      rows: checked.readyRows.map((item) => item.data),
      skipped: checked.skipped,
      errors,

      preview: checked.readyRows.slice(0, 100).map((item) => item.data),

      preview_limit: 100,
    };
  },

  async confirm(input: ConfirmImportPelangganInput) {
    if (!input.rows || input.rows.length === 0) {
      throw new AppError(
        400,
        "NO_VALID_ROWS",
        "Tidak ada data valid yang dapat diimpor.",
      );
    }

    // Normalisasi ulang untuk memastikan data yang disimpan bersih,
    // meskipun request confirm dikirim secara langsung.
    const parsedRows: ParsedRow[] = input.rows.map((data, index) => ({
      rowNumber: index + 2,
      data: {
        ...data,
        nama: normalizePersonName(data.nama),
      },
    }));

    try {
      return await prisma.$transaction(async (tx) => {
        // Validasi ulang kode unit, kode tarif, dan duplikat
        // menggunakan transaction client.
        const checked = await validateRows(parsedRows, tx);

        const skipped: SkippedRow[] = [...checked.skipped];
        const errors: RowError[] = [...checked.errors];

        let importedCount = 0;

        for (const item of checked.readyRows) {
          const row = item.data;

          try {
            const result = await tx.pelanggan.createMany({
              data: [
                {
                  id_pelanggan_pdam: row.id_pelanggan_pdam,
                  id_unit: item.id_unit,
                  nama: row.nama,
                  alamat: row.alamat,
                  id_tarif: item.id_tarif,
                  wm_no_seri_aktif: row.wm_no_seri_aktif || null,
                },
              ],
              skipDuplicates: true,
            });

            if (result.count > 0) {
              importedCount += result.count;
            } else {
              skipped.push({
                row: item.rowNumber,
                column: "id_pelanggan_pdam",
                id_pelanggan_pdam: row.id_pelanggan_pdam,
                reason: "ID Pelanggan PDAM sudah terdaftar saat proses import.",
              });
            }
          } catch {
            errors.push({
              row: item.rowNumber,
              field: "database",
              message: `Gagal menyimpan pelanggan ${row.id_pelanggan_pdam}.`,
            });
          }
        }

        return {
          imported_count: importedCount,
          skipped_count: skipped.length,
          failed_count: errors.length,
          skipped,
          errors,
        };
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        500,
        "IMPORT_FAILED",
        "Terjadi kesalahan saat proses import pelanggan.",
      );
    }
  },
};
