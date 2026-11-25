import type { AuthUser } from "../../middlewares/authenticate";
import { AppError } from "../../shared/errors/app-error";
import { dashboardRepository } from "./dashboard.repository";

type DashboardScope = {
  id_unit?: string;
  id_teknisi?: string;
};

function buildScope(user: AuthUser, requestedUnitId?: string): DashboardScope {
  if (user.role === "admin_pusat" || user.role === "pimpinan") {
    return requestedUnitId ? { id_unit: requestedUnitId } : {};
  }

  if (user.role === "admin_cabang") {
    if (!user.id_unit) {
      throw new AppError(
        403,
        "UNIT_ACCESS_DENIED",
        "Akun admin cabang tidak memiliki unit.",
      );
    }

    if (requestedUnitId && requestedUnitId !== user.id_unit) {
      throw new AppError(
        403,
        "UNIT_ACCESS_DENIED",
        "Admin cabang hanya dapat mengakses dashboard unitnya sendiri.",
      );
    }

    return { id_unit: user.id_unit };
  }

  if (user.role === "teknisi") {
    if (!user.id_unit) {
      throw new AppError(
        403,
        "UNIT_ACCESS_DENIED",
        "Akun teknisi tidak memiliki unit.",
      );
    }

    if (requestedUnitId && requestedUnitId !== user.id_unit) {
      throw new AppError(
        403,
        "UNIT_ACCESS_DENIED",
        "Teknisi hanya dapat mengakses data unitnya sendiri.",
      );
    }

    return { id_teknisi: user.id_user };
  }

  throw new AppError(
    403,
    "ROLE_ACCESS_DENIED",
    "Role tidak memiliki akses ke dashboard.",
  );
}

function getPeriod(periode?: string) {
  const currentDate = new Date();

  const selectedPeriod =
    periode ??
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(
      2,
      "0",
    )}`;

  const match = /^(\d{4})-(\d{2})$/.exec(selectedPeriod);

  if (!match) {
    throw new AppError(
      400,
      "INVALID_PERIOD",
      "Periode harus menggunakan format YYYY-MM.",
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (year < 2000 || year > 2100 || month < 1 || month > 12) {
    throw new AppError(
      400,
      "INVALID_PERIOD",
      "Periode yang dipilih tidak valid.",
    );
  }

  return {
    periode: selectedPeriod,
    startDate: new Date(year, month - 1, 1),
    endDate: new Date(year, month, 1),
  };
}

export const dashboardService = {
  async getSummary(user: AuthUser, periode?: string, requestedUnitId?: string) {
    const scope = buildScope(user, requestedUnitId);
    const period = getPeriod(periode);

    return dashboardRepository.getSummary(scope, period);
  },

  async getUnitProgress(
    user: AuthUser,
    periode?: string,
    requestedUnitId?: string,
  ) {
    const scope = buildScope(user, requestedUnitId);
    const period = getPeriod(periode);

    return dashboardRepository.getUnitProgress(scope, period);
  },
};
