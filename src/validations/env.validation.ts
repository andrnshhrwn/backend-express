import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(8000),

  API_PREFIX: z.string().default("/api/v1"),
  
  FRONTEND_URL: z.string().default("http://localhost:3000"),

  JWT_SECRET: z.string().min(32),
  
  JWT_EXPIRES_IN: z.string().default("1d"),
  
  REFRESH_EXPIRES_DAYS: z.coerce.number().int().positive().default(7),
  
  UPLOAD_DIR: z.string().default("uploads"),

  MAX_FILE_SIZE: z.coerce.number().int().positive().default(2097152),

  SUPABASE_URL: z.url(),

  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  SUPABASE_STORAGE_BUCKET: z.string().min(1).default("penggantian-wm"),
});

export type EnvConfig = z.infer<typeof envSchema>;
