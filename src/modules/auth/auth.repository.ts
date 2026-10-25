import { prisma } from "../../lib/prisma";

export const authRepository = {
  findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      select: {
        id_user: true,
        fullname: true,
        username: true,
        password: true,
        role: true,
        id_unit: true,
      },
    });
  },

  findById(id_user: number) {
    return prisma.user.findUnique({
      where: { id_user },
      select: {
        id_user: true,
        fullname: true,
        username: true,
        role: true,
        id_unit: true,
      },
    });
  },
};
