import "dotenv/config";
import { z } from "zod";
import { envSchema, type EnvConfig } from "../validations/env.validation.js";

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ KONFIGURASI ENVIRONMENT TIDAK VALID:");
  console.error(z.treeifyError(parsedEnv.error));

  process.exit(1);
}

export const env: EnvConfig = parsedEnv.data;
