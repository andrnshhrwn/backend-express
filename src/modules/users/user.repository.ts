// import { prisma } from "../../lib/prisma";

// const userSelect = {
//   id_user: true,
//   id_unit: true,
//   fullname: true,
//   username: true,
//   role: true,
//   unit: {
//     select: {
//       id_unit: true,
//       nama_unit: true,
//     },
//   },
// } as const;

// type UserRole = "admin_pusat" | "admin_cabang" | "teknisi";

// type CreateUserData = {
//   fullname: string;
//   username: string;
//   password: string;
//   role: UserRole;
//   id_unit?: string | null;
// };

// type UpdateUserData = {
//   fullname?: string;
//   username?: string;
//   password?: string;
//   role?: UserRole;
//   id_unit?: string | null;
// };

// export const userRepository = {
//   findAll() {
//     return prisma.user.findMany({
//       select: userSelect,
//       orderBy: { id_user: "asc" },
//     });
//   },

//   findById(id_user: string) {
//     return prisma.user.findUnique({
//       where: { id_user },
//       select: userSelect,
//     });
//   },

//   findByUsername(username: string) {
//     return prisma.user.findUnique({
//       where: { username },
//     });
//   },

//   findTeknisiByUnit(id_unit: string) {
//     return prisma.user.findMany({
//       where: {
//         role: "teknisi",
//         id_unit,
//       },
//       select: userSelect,
//       orderBy: {
//         fullname: "asc",
//       },
//     });
//   },

//   create(data: CreateUserData) {
//     return prisma.user.create({
//       data,
//       select: userSelect,
//     });
//   },

//   update(id_user: string, data: UpdateUserData) {
//     return prisma.user.update({
//       where: { id_user },
//       data,
//       select: userSelect,
//     });
//   },
// };

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

type UserRole = "admin_pusat" | "admin_cabang" | "teknisi" | "pimpinan";

type CreateUserData = {
  fullname: string;
  username: string;
  password: string;
  role: UserRole;
  id_unit?: string | null;
};

type UpdateUserData = {
  fullname?: string;
  username?: string;
  password?: string;
  role?: UserRole;
  id_unit?: string | null;
};

export const userRepository = {
  findAll() {
    return prisma.user.findMany({
      select: userSelect,
      orderBy: { id_user: "asc" },
    });
  },

  findById(id_user: string) {
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

  findTeknisiByUnit(id_unit: string) {
    return prisma.user.findMany({
      where: {
        role: "teknisi",
        id_unit,
      },
      select: userSelect,
      orderBy: {
        fullname: "asc",
      },
    });
  },

  create(data: CreateUserData) {
    return prisma.user.create({
      data,
      select: userSelect,
    });
  },

  update(id_user: string, data: UpdateUserData) {
    return prisma.user.update({
      where: { id_user },
      data,
      select: userSelect,
    });
  },
};
