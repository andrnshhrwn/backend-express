import * as XLSX from "xlsx";
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
  const rows: ImportPelangganRow[] = [];
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

    rows.push(result.data);
  });

  return { rows, errors };
}

async function validateReferencesAndDuplicates(rows: ImportPelangganRow[]) {
  const errors: RowError[] = [];

  const seen = new Map<string, number>();

  rows.forEach((row, index) => {
    const key = row.id_pelanggan_pdam;
    const rowNumber = index + 2;
    const previous = seen.get(key);

    if (previous !== undefined) {
      errors.push({
        row: rowNumber,
        field: "id_pelanggan_pdam",
        message: `Duplikat dengan baris ${previous}.`,
      });
    } else {
      seen.set(key, rowNumber);
    }
  });

  const customerNumbers = [...seen.keys()];

  const unitIds = [...new Set(rows.map((r) => r.id_unit))];
  const tariffIds = [...new Set(rows.map((r) => r.id_tarif))];

  const [existingCustomers, units, tariffs] = await Promise.all([
    prisma.pelanggan.findMany({
      where: {
        id_pelanggan_pdam: { in: customerNumbers },
      },
      select: { id_pelanggan_pdam: true },
    }),
    prisma.unit.findMany({
      where: { id_unit: { in: unitIds } },
      select: { id_unit: true },
    }),
    prisma.tipeTarif.findMany({
      where: { id_tarif: { in: tariffIds } },
      select: { id_tarif: true },
    }),
  ]);

  const existingNumbers = new Set(
    existingCustomers.map((p) => p.id_pelanggan_pdam),
  );
  const existingUnits = new Set(units.map((u) => u.id_unit));
  const existingTariffs = new Set(tariffs.map((t) => t.id_tarif));

  rows.forEach((row, index) => {
    const rowNumber = index + 2;

    if (existingNumbers.has(row.id_pelanggan_pdam)) {
      errors.push({
        row: rowNumber,
        field: "id_pelanggan_pdam",
        message: "Nomor pelanggan sudah terdaftar.",
      });
    }

    if (!existingUnits.has(row.id_unit)) {
      errors.push({
        row: rowNumber,
        field: "id_unit",
        message: `Unit ID ${row.id_unit} tidak ditemukan.`,
      });
    }

    if (!existingTariffs.has(row.id_tarif)) {
      errors.push({
        row: rowNumber,
        field: "id_tarif",
        message: `Tarif ${row.id_tarif} tidak ditemukan.`,
      });
    }
  });

  return errors;
}

export const importPelangganService = {
  async preview(buffer: Buffer) {
    const rawRows = parseExcel(buffer);
    const normalized = normalizeRows(rawRows);

    const referenceErrors =
      normalized.rows.length > 0
        ? await validateReferencesAndDuplicates(normalized.rows)
        : [];

    const errors = [...normalized.errors, ...referenceErrors];

    return {
      total_rows: rawRows.length,
      valid_rows: Math.max(
        0,
        rawRows.length - new Set(errors.map((e) => e.row)).size,
      ),
      invalid_rows: new Set(errors.map((e) => e.row)).size,
      can_import: errors.length === 0,
      errors,
      rows: normalized.rows,
      preview: normalized.rows.slice(0, 100),
      preview_limit: 100,
    };
  },

  async confirm(input: ConfirmImportPelangganInput) {
    const rows = input.rows;

    const errors = await validateReferencesAndDuplicates(rows);

    if (errors.length > 0) {
      throw new AppError(
        422,
        "IMPORT_VALIDATION_FAILED",
        "Data berubah atau tidak valid. Silakan upload dan preview ulang.",
        errors,
      );
    }

    try {
      const imported = await prisma.$transaction(async (tx) => {
        // Periksa ulang nomor pelanggan dalam transaksi untuk
        // menangkap duplikasi yang muncul setelah preview.
        const existing = await tx.pelanggan.findMany({
          where: {
            id_pelanggan_pdam: {
              in: rows.map((row) => row.id_pelanggan_pdam),
            },
          },
          select: { id_pelanggan_pdam: true },
        });

        if (existing.length > 0) {
          throw new AppError(
            409,
            "CUSTOMER_ALREADY_EXISTS",
            "Ada nomor pelanggan yang sudah terdaftar. Preview ulang file.",
          );
        }

        await tx.pelanggan.createMany({
          data: rows.map((row) => ({
            id_pelanggan_pdam: row.id_pelanggan_pdam,
            id_unit: row.id_unit,
            nama: row.nama,
            alamat: row.alamat,
            id_tarif: row.id_tarif,
            wm_no_seri_aktif: row.wm_no_seri_aktif || null,
          })),
        });

        return rows.length;
      });

      return { imported_count: imported };
    } catch (error) {
      if (error instanceof AppError) throw error;

      throw new AppError(
        409,
        "IMPORT_FAILED",
        "Impor gagal. Periksa duplikasi atau relasi data, lalu coba kembali.",
      );
    }
  },
};
