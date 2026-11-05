import type { AuthUser } from "../../middlewares/authenticate";
import { AppError } from "../../shared/errors/app-error";
import { penugasanRepository } from "./penugasan.repository";

type CreatePenugasanInput = {
  id_pelanggan: string;
  id_unit: string;
  tgl_penugasan?: Date;
  alasan: string;
};

type UpdatePenugasanInput = {
  tgl_penugasan?: Date;
  alasan?: string;
  status?: "pending" | "proses" | "selesai" | "dibatalkan";
};

export const penugasanService = {
  async getAll(user: AuthUser) {
    return penugasanRepository.findAll(buildAccessScope(user));
  },

  async getById(id: string, user: AuthUser) {
    const data = await penugasanRepository.findById(id, buildAccessScope(user));

    if (!data) {
      throw new AppError(
        404,
        "PENUGASAN_NOT_FOUND",
        "Data penugasan tidak ditemukan.",
      );
    }

    return data;
  },

  async validateReferences(idPelanggan: string, idUnit: string) {
    const [pelanggan, unit] = await Promise.all([
      penugasanRepository.findPelangganById(idPelanggan),
      penugasanRepository.findUnitById(idUnit),
    ]);

    if (!pelanggan) {
      throw new AppError(
        404,
        "PELANGGAN_NOT_FOUND",
        "Pelanggan tidak ditemukan.",
      );
    }

    if (!unit) {
      throw new AppError(404, "UNIT_NOT_FOUND", "Unit tidak ditemukan.");
    }

    if (pelanggan.id_unit !== idUnit) {
      throw new AppError(
        422,
        "UNIT_PELANGGAN_MISMATCH",
        "Unit penugasan harus sesuai dengan unit pelanggan.",
      );
    }

    return {
      pelanggan,
      unit,
    };
  },

  async validateTeknisi(idTeknisi: string, idUnit: string) {
    const teknisi = await penugasanRepository.findTeknisiById(
      idTeknisi,
      idUnit,
    );

    if (!teknisi) {
      throw new AppError(
        422,
        "INVALID_TEKNISI",
        "Teknisi tidak valid atau bukan berasal dari unit penugasan.",
      );
    }

    return teknisi;
  },

  async create(data: CreatePenugasanInput, user: AuthUser) {
    if (user.role !== "admin_cabang") {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Hanya admin cabang yang dapat membuat penugasan.",
      );
    }

    if (user.id_unit === null || user.id_unit !== data.id_unit) {
      throw new AppError(
        403,
        "FORBIDDEN_UNIT",
        "Admin cabang hanya dapat membuat penugasan untuk unitnya sendiri.",
      );
    }

    const { pelanggan } = await this.validateReferences(
      data.id_pelanggan,
      data.id_unit,
    );

    const active = await penugasanRepository.findActiveByPelangganId(
      pelanggan.id_pelanggan,
    );

    if (active) {
      throw new AppError(
        409,
        "ACTIVE_PENUGASAN_EXISTS",
        "Pelanggan masih memiliki penugasan aktif dengan status pending atau proses.",
      );
    }

    const nomorSpk = await generateNomorSpk();

    return penugasanRepository.create({
      nomor_spk: nomorSpk,
      ...data,
      id_user_penugasan: user.id_user,
    });
  },

  async assignTeknisi(id: string, idTeknisi: string, user: AuthUser) {
    if (user.role !== "admin_cabang" || user.id_unit === null) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Hanya admin cabang yang dapat menetapkan teknisi.",
      );
    }

    const current = await this.getById(id, user);

    if (current.status !== "pending") {
      throw new AppError(
        409,
        "INVALID_PENUGASAN_STATUS",
        "Teknisi hanya dapat ditetapkan pada penugasan berstatus pending.",
      );
    }

    await this.validateTeknisi(idTeknisi, current.id_unit);

    return penugasanRepository.assignTeknisi(id, idTeknisi);
  },

  async cancel(id: string, user: AuthUser) {
    if (user.role !== "admin_cabang" || user.id_unit === null) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Hanya admin cabang yang dapat membatalkan SPK.",
      );
    }

    const current = await this.getById(id, user);

    if (current.status !== "pending") {
      throw new AppError(
        409,
        "PENUGASAN_CANNOT_CANCEL",
        "Hanya SPK berstatus pending yang dapat dibatalkan.",
      );
    }

    return penugasanRepository.update(id, {
      status: "dibatalkan",
    });
  },

  async update(id: string, data: UpdatePenugasanInput, user: AuthUser) {
    const current = await this.getById(id, user);

    // Admin cabang hanya dapat mengubah informasi penugasan
    // ketika status masih pending.
    if (user.role === "admin_cabang") {
      if (current.status !== "pending") {
        throw new AppError(
          409,
          "INVALID_PENUGASAN_STATUS",
          "Informasi penugasan hanya dapat diubah selama status pending.",
        );
      }

      if (data.status !== undefined) {
        throw new AppError(
          403,
          "FORBIDDEN_STATUS_UPDATE",
          "Admin cabang tidak dapat mengubah status pengerjaan melalui endpoint ini.",
        );
      }

      return penugasanRepository.update(id, {
        ...(data.tgl_penugasan !== undefined
          ? { tgl_penugasan: data.tgl_penugasan }
          : {}),
        ...(data.alasan !== undefined ? { alasan: data.alasan } : {}),
      });
    }

    if (user.role === "teknisi") {
      if (current.id_teknisi !== user.id_user) {
        throw new AppError(
          403,
          "FORBIDDEN_PENUGASAN",
          "Anda tidak memiliki akses untuk mengubah penugasan ini.",
        );
      }

      if (
        data.tgl_penugasan !== undefined ||
        data.alasan !== undefined ||
        data.status === undefined
      ) {
        throw new AppError(
          422,
          "INVALID_UPDATE",
          "Teknisi hanya dapat memperbarui status penugasan.",
        );
      }

      const allowedTransitions: Record<string, string[]> = {
        pending: ["proses"],
        proses: ["selesai"],
      };

      if (!allowedTransitions[current.status]?.includes(data.status)) {
        throw new AppError(
          409,
          "INVALID_STATUS_TRANSITION",
          "Perubahan status penugasan tidak diperbolehkan.",
        );
      }

      return penugasanRepository.update(id, {
        status: data.status,
      });
    }
    throw new AppError(
      403,
      "FORBIDDEN",
      "Admin pusat hanya memiliki akses pemantauan penugasan.",
    );
  },

  async delete(id: string, user: AuthUser) {
    if (user.role !== "admin_cabang" || user.id_unit === null) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Hanya admin cabang yang dapat menghapus penugasan.",
      );
    }

    const current = await this.getById(id, user);

    if (!["pending", "dibatalkan"].includes(current.status)) {
      throw new AppError(
        409,
        "PENUGASAN_CANNOT_DELETE",
        "Hanya penugasan berstatus pending atau dibatalkan yang dapat dihapus.",
      );
    }

    const penggantian =
      await penugasanRepository.findPenggantianByPenugasanId(id);

    if (penggantian) {
      throw new AppError(
        409,
        "PENUGASAN_HAS_PENGGANTIAN",
        "Penugasan tidak dapat dihapus karena sudah memiliki data penggantian WM.",
      );
    }

    return penugasanRepository.delete(id);
  },
};

function getJakartaDateKey(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new AppError(
      500,
      "SPK_DATE_GENERATION_FAILED",
      "Gagal menentukan tanggal nomor SPK.",
    );
  }

  return `${year}${month}${day}`;
}

async function generateNomorSpk(): Promise<string> {
  const tanggal = getJakartaDateKey();

  const sequence = await penugasanRepository.getNextSpkSequence(tanggal);

  return `SPK-${tanggal}-${String(sequence).padStart(4, "0")}`;
}

function buildAccessScope(user: AuthUser) {
  if (user.role === "admin_pusat") {
    return {};
  }

  if (user.role === "admin_cabang") {
    if (user.id_unit === null) {
      throw new AppError(
        403,
        "UNIT_ACCESS_DENIED",
        "Akun admin cabang tidak memiliki unit.",
      );
    }

    return {
      id_unit: user.id_unit,
    };
  }

  if (user.role === "teknisi") {
    if (user.id_unit === null) {
      throw new AppError(
        403,
        "UNIT_ACCESS_DENIED",
        "Akun teknisi tidak memiliki unit.",
      );
    }

    return {
      id_unit: user.id_unit,
      id_teknisi: user.id_user,
    };
  }

  throw new AppError(
    403,
    "FORBIDDEN",
    "Role tidak memiliki akses ke data penugasan.",
  );
}
