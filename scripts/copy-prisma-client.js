import { cpSync, existsSync, mkdirSync } from "node:fs";

const source = "src/generated/prisma";
const destination = "dist/generated/prisma";

if (!existsSync(source)) {
  throw new Error(
    `Prisma Client tidak ditemukan: ${source}. Jalankan prisma generate terlebih dahulu.`,
  );
}

mkdirSync("dist/generated", { recursive: true });

cpSync(source, destination, {
  recursive: true,
  force: true,
});

console.log("Prisma Client berhasil disalin ke dist/generated/prisma");
