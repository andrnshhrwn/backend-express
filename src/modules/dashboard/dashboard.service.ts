import type { AuthUser } from "../../middlewares/authenticate";
import { AppError } from "../../shared/errors/app-error";
import { dashboardRepository } from "./dashboard.repository";

function buildScope(user: AuthUser) {
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

  if (user.id_unit === null) {
    throw new AppError(
      403,
      "UNIT_ACCESS_DENIED",
      "Akun teknisi tidak memiliki unit.",
    );
  }

  return {
    id_teknisi: user.id_user,
  };
}

function getPeriod(periode?: string) {
  const year = periode ? Number(periode) : new Date().getFullYear();

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new AppError(
      400,
      "INVALID_PERIOD",
      "Periode harus berupa tahun yang valid.",
    );
  }

  return {
    startDate: new Date(year, 0, 1),
    endDate: new Date(year + 1, 0, 1),
  };
}

export const dashboardService = {
  async getSummary(user: AuthUser, periode?: string) {
    const scope = buildScope(user);
    const { startDate, endDate } = getPeriod(periode);

    return dashboardRepository.getSummary(scope, startDate, endDate);
  },

  async getUnitProgress(user: AuthUser, periode?: string) {
    const scope = buildScope(user);
    const { startDate, endDate } = getPeriod(periode);

    return dashboardRepository.getUnitProgress(scope, startDate, endDate);
  },
};
