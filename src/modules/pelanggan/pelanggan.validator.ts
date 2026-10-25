import { z } from "zod";
import { validate } from "../../middlewares/validate";

const pelangganIdSchema = z.object({
  id: z.coerce
    .number()
    .int("ID pelanggan harus berupa bilangan bulat")
    .positive("ID pelanggan harus lebih besar dari 0"),
});

const createPelangganSchema = z.object({
  id_pelanggan_pdam: z
    .string()
    .trim()
    .min(1, "Nomor pelanggan PDAM wajib diisi")
    .max(50, "Nomor pelanggan PDAM maksimal 50 karakter"),

  id_unit: z.coerce
    .number()
    .int("ID unit harus berupa bilangan bulat")
    .positive("ID unit harus lebih besar dari 0"),

  nama: z
    .string()
    .trim()
    .min(1, "Nama pelanggan wajib diisi")
    .max(100, "Nama pelanggan maksimal 100 karakter"),

  alamat: z
    .string()
    .trim()
    .min(1, "Alamat pelanggan wajib diisi")
    .max(255, "Alamat pelanggan maksimal 255 karakter"),

  id_tarif: z
    .string()
    .trim()
    .min(1, "ID tarif wajib diisi")
    .max(20, "ID tarif maksimal 20 karakter"),

  wm_no_seri_aktif: z
    .string()
    .trim()
    .max(50, "Nomor seri WM maksimal 50 karakter")
    .nullable()
    .optional(),
});

const updatePelangganSchema = z
  .object({
    id_pelanggan_pdam: z
      .string()
      .trim()
      .min(1, "Nomor pelanggan PDAM wajib diisi")
      .max(50, "Nomor pelanggan PDAM maksimal 50 karakter")
      .optional(),

    id_unit: z.coerce
      .number()
      .int("ID unit harus berupa bilangan bulat")
      .positive("ID unit harus lebih besar dari 0")
      .optional(),

    nama: z
      .string()
      .trim()
      .min(1, "Nama pelanggan wajib diisi")
      .max(100, "Nama pelanggan maksimal 100 karakter")
      .optional(),

    alamat: z
      .string()
      .trim()
      .min(1, "Alamat pelanggan wajib diisi")
      .max(255, "Alamat pelanggan maksimal 255 karakter")
      .optional(),

    id_tarif: z
      .string()
      .trim()
      .min(1, "ID tarif wajib diisi")
      .max(20, "ID tarif maksimal 20 karakter")
      .optional(),

    wm_no_seri_aktif: z
      .string()
      .trim()
      .max(50, "Nomor seri WM maksimal 50 karakter")
      .nullable()
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "Minimal satu field harus diisi",
  );

export const validatePelangganId = validate(pelangganIdSchema, "params");

export const validateCreatePelanggan = validate(createPelangganSchema, "body");

export const validateUpdatePelanggan = validate(updatePelangganSchema, "body");
