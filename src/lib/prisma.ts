import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma-mysql/client.js";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? "127.0.0.1",
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_USER ?? "root",
  password: process.env.DATABASE_PASSWORD ?? "",
  database: process.env.DATABASE_NAME ?? "express_prisma_db",
  connectionLimit: 5,
});

export const prisma = new PrismaClient({
  adapter,
});
// import "dotenv/config";
// import { Pool } from "pg";
// import { PrismaPg } from "@prisma/adapter-pg";
// import { PrismaClient } from "../generated/prisma/client.js";

// const globalForPrisma = globalThis as unknown as {
//   prisma?: PrismaClient;
//   pgPool?: Pool;
// };

// const connectionString = process.env.DIRECT_URL;

// if (!connectionString) {
//   throw new Error("DATABASE_URL wajib diisi di environment");
// }

// const pool =
//   globalForPrisma.pgPool ??
//   new Pool({
//     connectionString,
//   });

// const adapter = new PrismaPg(pool);

// export const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     adapter,
//   });

// if (process.env.NODE_ENV !== "production") {
//   globalForPrisma.pgPool = pool;
//   globalForPrisma.prisma = prisma;
// }