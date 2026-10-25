import { prisma } from "../../lib/prisma";

const userSelect = {
  id_user: true,
  id_unit: true,
  fullname: true,
  username: true,
  role: true,
  unit: {
    select: {
      id_unit: true,
      nama_unit: true,
    },
  },
} as const;

export const userRepository = {
  findAll() {
    return prisma.user.findMany({
      select: userSelect,
      orderBy: { id_user: "asc" },
    });
  },

  findById(id_user: number) {
    return prisma.user.findUnique({
      where: { id_user },
      select: userSelect,
    });
  },

  findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
    });
  },

  create(data: {
    fullname: string;
    username: string;
    password: string;
    role: "admin_pusat" | "admin_cabang" | "teknisi";
    id_unit?: number | null;
  }) {
    return prisma.user.create({
      data,
      select: userSelect,
    });
  },

  update(
    id_user: number,
    data: {
      fullname?: string;
      username?: string;
      password?: string;
      role?: "admin_pusat" | "admin_cabang" | "teknisi";
      id_unit?: number | null;
    },
  ) {
    return prisma.user.update({
      where: { id_user },
      data,
      select: userSelect,
    });
  },
};
