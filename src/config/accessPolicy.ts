export type Platform = "web" | "android";
export type Role = "admin_pusat" | "admin_cabang" | "teknisi" | "pimpinan";

export const ROLE_PLATFORMS: Record<Role, Platform[]> = {
  admin_pusat: ["web"],
  admin_cabang: ["web"],
  teknisi: ["android"],
  pimpinan: ["web"],
};

export const isPlatform = (value: unknown): value is Platform =>
  value === "web" || value === "android";

export const canAccess = (role: string, platform: Platform): boolean =>
  ROLE_PLATFORMS[role as Role]?.includes(platform) ?? false;
