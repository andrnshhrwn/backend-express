
import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";

async function main() {
  const username = "admin.pusat";
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password || password.length < 12) {
    throw new Error(
      "SEED_ADMIN_PASSWORD wajib diisi dan minimal 12 karakter",
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      fullname: "Administrator Pusat",
      username,
      password: hashedPassword,
      role: "admin_pusat",
      id_unit: null,
    },
  });

  console.log(`Akun ${username} siap digunakan.`);
}

main()
  .catch((error) => {
    console.error("Seed akun admin gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
