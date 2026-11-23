import { z } from "zod";
import { validate } from "../../middlewares/validate";

const uuidSchema = z.uuid("ID harus berupa UUID yang valid");

const userIdSchema = z.object({
  id: uuidSchema,
});

const userRoleSchema = z.enum(["admin_pusat", "admin_cabang", "teknisi", "pimpinan"], {
  message: "Role pengguna tidak valid",
});

const createUserSchema = z
  .object({
    fullname: z
      .string()
      .trim()
      .min(1, "Nama lengkap wajib diisi")
      .max(100, "Nama lengkap maksimal 100 karakter"),

    username: z
      .string()
      .trim()
      .min(3, "Username minimal 3 karakter")
      .max(50, "Username maksimal 50 karakter")
      .regex(
        /^[a-zA-Z0-9_.-]+$/,
        "Username hanya boleh berisi huruf, angka, titik, garis bawah, dan tanda hubung",
      ),

    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .max(72, "Password maksimal 72 karakter"),

    role: userRoleSchema,

    id_unit: uuidSchema.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "admin_pusat" && data.id_unit != null) {
      ctx.addIssue({
        code: "custom",
        path: ["id_unit"],
        message: "Admin pusat tidak boleh terikat pada unit",
      });
    }

    if (data.role !== "admin_pusat" && data.id_unit == null) {
      ctx.addIssue({
        code: "custom",
        path: ["id_unit"],
        message: "Unit wajib diisi untuk admin cabang dan teknisi",
      });
    }
  });

const createTeknisiSchema = z.object({
  fullname: z
    .string()
    .trim()
    .min(1, "Nama lengkap wajib diisi")
    .max(100, "Nama lengkap maksimal 100 karakter"),

  username: z
    .string()
    .trim()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username maksimal 50 karakter")
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      "Username hanya boleh berisi huruf, angka, titik, garis bawah, dan tanda hubung",
    ),

  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter"),
});

const updateUserSchema = z
  .object({
    fullname: z
      .string()
      .trim()
      .min(1, "Nama lengkap wajib diisi")
      .max(100, "Nama lengkap maksimal 100 karakter")
      .optional(),

    username: z
      .string()
      .trim()
      .min(3, "Username minimal 3 karakter")
      .max(50, "Username maksimal 50 karakter")
      .regex(/^[a-zA-Z0-9_.-]+$/, "Format username tidak valid")
      .optional(),

    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .max(72, "Password maksimal 72 karakter")
      .optional(),

    role: userRoleSchema.optional(),

    id_unit: uuidSchema.nullable().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "Minimal satu field harus diisi",
  )
  .superRefine((data, ctx) => {
    if (
      data.role === "admin_pusat" &&
      data.id_unit !== undefined &&
      data.id_unit !== null
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["id_unit"],
        message: "Admin pusat tidak boleh terikat pada unit",
      });
    }

    if (
      data.role !== undefined &&
      data.role !== "admin_pusat" &&
      data.id_unit === null
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["id_unit"],
        message: "Unit wajib diisi untuk admin cabang dan teknisi",
      });
    }
  });

export const validateUserId = validate(userIdSchema, "params");

export const validateCreateUser = validate(createUserSchema, "body");

export const validateCreateTeknisi = validate(createTeknisiSchema, "body");

export const validateUpdateUser = validate(updateUserSchema, "body");
