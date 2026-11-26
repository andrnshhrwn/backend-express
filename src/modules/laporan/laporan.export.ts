import XLSX from "xlsx-js-style";

interface ExcelOptions {
  fileName: string;
  sheetName: string;
  title: string;
  exportedAt: Date;

  period?: { dari?: string | null; sampai?: string | null };
  summary: Record<string, string | number>;
  columns: string[];
  rows: Record<string, string | number | null>[];
}

type CellStyle = {
  font?: Record<string, unknown>;
  fill?: Record<string, unknown>;
  alignment?: Record<string, unknown>;
  border?: Record<string, unknown>;
  numFmt?: string;
};

const FONT = "Calibri";

const COLORS = {
  navy: "17365D",
  blue: "1F4E79",
  paleBlue: "EAF1F8",
  white: "FFFFFF",
  text: "1F2937",
  muted: "6B7280",
  border: "BFCBD8",
  zebra: "F3F7FB",
  green: "E2F0E9",
};

const thinBorder = {
  top: { style: "thin", color: { rgb: COLORS.border } },
  bottom: { style: "thin", color: { rgb: COLORS.border } },
  left: { style: "thin", color: { rgb: COLORS.border } },
  right: { style: "thin", color: { rgb: COLORS.border } },
};

const headerBorder = {
  ...thinBorder,
  bottom: { style: "medium", color: { rgb: COLORS.navy } },
};

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function formatDateOnly(value: Date | null | undefined): string {
  if (!value) return "-";

  return new Date(value).toISOString().slice(0, 10);
}

export function formatDateTimeWib(value: Date | null | undefined): string {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

function formatLongDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function formatPeriod(dari?: string | null, sampai?: string | null) {
  if (dari && sampai) {
    return dari === sampai
      ? formatLongDate(dari)
      : `${formatLongDate(dari)} s/d ${formatLongDate(sampai)}`;
  }
  if (dari) return `Mulai ${formatLongDate(dari)}`;
  if (sampai) return `Sampai ${formatLongDate(sampai)}`;
  return "Semua periode";
}

function numberFormat(value: number): string {
  return Number.isInteger(value) ? "#,##0" : "#,##0.00";
}

function setCellStyle(
  worksheet: XLSX.WorkSheet,
  address: string,
  style: CellStyle,
) {
  const cell = worksheet[address];

  if (cell) {
    cell.s = style;
  }
}

function styleRange(
  worksheet: XLSX.WorkSheet,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
  style: CellStyle,
) {
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const address = XLSX.utils.encode_cell({ r: row, c: col });
      setCellStyle(worksheet, address, style);
    }
  }
}

function createSummaryWorksheet(options: ExcelOptions) {
  const summaryEntries = Object.entries(options.summary);

  const rows: (string | number)[][] = [
    ["LAPORAN PAM TIRTA KAMUNING", ""],
    [options.title, ""],
    ["", ""],
    ["INFORMASI EKSPOR", ""],
    ["Tanggal Export", formatDateTimeWib(options.exportedAt)],
    [
      "Periode Laporan",
      formatPeriod(options.period?.dari, options.period?.sampai),
    ],
    ["", ""],
    ["RINGKASAN LAPORAN", ""],
    ["Indikator", "Nilai"],
    ...summaryEntries,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } },
    { s: { r: 7, c: 0 }, e: { r: 7, c: 1 } },
  ];

  const labelWidth = summaryEntries.reduce(
    (max, [key]) => Math.max(max, key.length),
    "Periode Laporan".length,
  );
  const valueWidth = summaryEntries.reduce(
    (max, [, value]) =>
      Math.max(
        max,
        typeof value === "number"
          ? value.toLocaleString("id-ID").length
          : String(value).length,
      ),
    formatPeriod(options.period?.dari, options.period?.sampai).length,
  );

  worksheet["!cols"] = [
    { wch: Math.min(Math.max(labelWidth + 4, 30), 50) },
    { wch: Math.min(Math.max(valueWidth + 4, 34), 50) },
  ];

  const rowHeights = [
    { hpt: 34 },
    { hpt: 24 },
    { hpt: 10 },
    { hpt: 24 },
    { hpt: 24 },
    { hpt: 24 },
    { hpt: 10 },
    { hpt: 24 },
    { hpt: 26 },
  ];
  worksheet["!rows"] = rowHeights;

  styleRange(worksheet, 0, 0, 0, 1, {
    font: { name: FONT, bold: true, sz: 18, color: { rgb: COLORS.white } },
    fill: { fgColor: { rgb: COLORS.navy } },
    alignment: { vertical: "center", horizontal: "left", indent: 1 },
  });

  styleRange(worksheet, 1, 1, 0, 1, {
    font: { name: FONT, sz: 12, color: { rgb: COLORS.white } },
    fill: { fgColor: { rgb: COLORS.blue } },
    alignment: { vertical: "center", horizontal: "left", indent: 1 },
  });

  for (const r of [3, 7]) {
    styleRange(worksheet, r, r, 0, 1, {
      font: { name: FONT, bold: true, sz: 11, color: { rgb: COLORS.white } },
      fill: { fgColor: { rgb: COLORS.navy } },
      alignment: { vertical: "center", horizontal: "left", indent: 1 },
    });
  }

  styleRange(worksheet, 8, 8, 0, 1, {
    font: { name: FONT, bold: true, sz: 11, color: { rgb: COLORS.white } },
    fill: { fgColor: { rgb: COLORS.blue } },
    alignment: { vertical: "center", horizontal: "center" },
    border: headerBorder,
  });

  for (const r of [4, 5]) {
    setCellStyle(worksheet, XLSX.utils.encode_cell({ r, c: 0 }), {
      font: { name: FONT, bold: true, sz: 11, color: { rgb: COLORS.text } },
      fill: { fgColor: { rgb: COLORS.paleBlue } },
      alignment: { vertical: "center", horizontal: "left", indent: 1 },
      border: thinBorder,
    });
    setCellStyle(worksheet, XLSX.utils.encode_cell({ r, c: 1 }), {
      font: { name: FONT, sz: 11, color: { rgb: COLORS.text } },
      fill: { fgColor: { rgb: COLORS.white } },
      alignment: { vertical: "center", horizontal: "left", indent: 1 },
      border: thinBorder,
    });
  }

  summaryEntries.forEach(([, value], i) => {
    const r = 9 + i;
    const background = i % 2 === 0 ? COLORS.white : COLORS.zebra;
    const isNumber = typeof value === "number";

    setCellStyle(worksheet, XLSX.utils.encode_cell({ r, c: 0 }), {
      font: { name: FONT, sz: 11, bold: true, color: { rgb: COLORS.text } },
      fill: { fgColor: { rgb: background } },
      alignment: { vertical: "center", horizontal: "left", indent: 1 },
      border: thinBorder,
    });

    setCellStyle(worksheet, XLSX.utils.encode_cell({ r, c: 1 }), {
      font: { name: FONT, sz: 12, bold: true, color: { rgb: COLORS.navy } },
      fill: { fgColor: { rgb: isNumber ? COLORS.green : background } },
      alignment: {
        vertical: "center",
        horizontal: isNumber ? "right" : "left",
        indent: 1,
      },
      border: thinBorder,
      ...(isNumber ? { numFmt: numberFormat(value) } : {}),
    });

    rowHeights[r] = { hpt: 24 };
  });

  return worksheet;
}

function createDataWorksheet(options: ExcelOptions) {
  const columnCount = options.columns.length;
  const lastColumn = XLSX.utils.encode_col(columnCount - 1);

  const rows = [
    [options.title, ...Array(columnCount - 1).fill("")],
    [
      `Periode: ${formatPeriod(options.period?.dari, options.period?.sampai)}   |   Diekspor: ${formatDateTimeWib(options.exportedAt)}`,
      ...Array(columnCount - 1).fill(""),
    ],
    [],
    options.columns,
    ...options.rows.map((row) =>
      options.columns.map((column) => row[column] ?? "-"),
    ),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columnCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: columnCount - 1 } },
  ];

  worksheet["!cols"] = options.columns.map((column) => {
    const maxDataWidth = options.rows.reduce((max, row) => {
      const value = row[column];
      const length =
        typeof value === "number"
          ? value.toLocaleString("id-ID").length
          : String(value ?? "").length;

      return Math.max(max, length);
    }, column.length);

    return { wch: Math.min(Math.max(maxDataWidth + 4, 14), 45) };
  });

  worksheet["!rows"] = [{ hpt: 32 }, { hpt: 22 }, { hpt: 10 }, { hpt: 32 }];

  styleRange(worksheet, 0, 0, 0, columnCount - 1, {
    font: { name: FONT, bold: true, sz: 16, color: { rgb: COLORS.white } },
    fill: { fgColor: { rgb: COLORS.navy } },
    alignment: { vertical: "center", horizontal: "left", indent: 1 },
  });

  styleRange(worksheet, 1, 1, 0, columnCount - 1, {
    font: { name: FONT, sz: 10, italic: true, color: { rgb: COLORS.muted } },
    fill: { fgColor: { rgb: COLORS.paleBlue } },
    alignment: { vertical: "center", horizontal: "left", indent: 1 },
  });

  styleRange(worksheet, 3, 3, 0, columnCount - 1, {
    font: { name: FONT, bold: true, sz: 11, color: { rgb: COLORS.white } },
    fill: { fgColor: { rgb: COLORS.blue } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: headerBorder,
  });

  for (let r = 0; r < options.rows.length; r++) {
    const excelRow = r + 4;
    const background = r % 2 === 0 ? COLORS.white : COLORS.zebra;

    for (let c = 0; c < columnCount; c++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: excelRow, c })];
      if (!cell) continue;

      const raw = options.rows[r][options.columns[c]];
      const isNumber = typeof raw === "number";
      const isDate = typeof raw === "string" && DATE_ONLY_REGEX.test(raw);
      const isEmpty = raw === null || raw === undefined || raw === "";

      const style: CellStyle = {
        font: { name: FONT, sz: 11, color: { rgb: COLORS.text } },
        fill: { fgColor: { rgb: background } },
        alignment: {
          vertical: "center",
          horizontal: isNumber
            ? "right"
            : isDate || isEmpty
              ? "center"
              : "left",
          wrapText: true,
          ...(isNumber || isDate || isEmpty ? {} : { indent: 1 }),
        },
        border: thinBorder,
      };

      if (isNumber) style.numFmt = numberFormat(raw);

      cell.s = style;
    }
  }

  const lastRow = options.rows.length + 4;

  worksheet["!autofilter"] = { ref: `A4:${lastColumn}${lastRow}` };

  worksheet["!freeze"] = {
    xSplit: 0,
    ySplit: 4,
    topLeftCell: "A5",
    activePane: "bottomLeft",
    state: "frozen",
  };

  return worksheet;
}

export function createExcelFile(options: ExcelOptions): Buffer {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    createSummaryWorksheet(options),
    "Ringkasan",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    createDataWorksheet(options),
    options.sheetName,
  );

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
    compression: true,
  }) as Buffer;
}
