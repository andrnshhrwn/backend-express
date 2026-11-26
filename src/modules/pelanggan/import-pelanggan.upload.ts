import multer from "multer";
import path from "node:path";
import { AppError } from "../../shared/errors/app-error.js";

const uploadImportFile = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (![".csv", ".xlsx", ".xls"].includes(ext)) {
      callback(
        new AppError(
          400,
          "INVALID_FILE_TYPE",
          "File harus berformat .csv, .xlsx, atau .xls.",
        ),
      );
      return;
    }

    callback(null, true);
  },
});

export const uploadPelangganImport = uploadImportFile.single("file");
