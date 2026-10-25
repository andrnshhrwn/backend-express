import { z } from "zod";
import { validate } from "../../middlewares/validate";

const userIdSchema = z.object({
  id: z.coerce
    .number()
    .int("ID pengguna harus berupa bilangan bulat")
    .positive("ID pengguna harus lebih besar dari 0"),
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

    role: z.enum(["admin_pusat", "admin_cabang", "teknisi"], {
      message: "Role pengguna tidak valid",
    }),

    id_unit: z.coerce
      .number()
      .int("ID unit harus berupa bilangan bulat")
      .positive("ID unit harus lebih besar dari 0")
      .nullable()
      .optional(),
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

    role: z.enum(["admin_pusat", "admin_cabang", "teknisi"]).optional(),

    id_unit: z
      .union([
        z.coerce.number().int().positive("ID unit harus lebih besar dari 0"),
        z.null(),
      ])
      .optional(),
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

export const validateUpdateUser = validate(updateUserSchema, "body");
