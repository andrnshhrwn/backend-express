import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function bootstrap() {
  try {
    await prisma.$connect();

    app.listen(env.PORT, () => {
      console.log(
        `API running at http://localhost:${env.PORT}${env.API_PREFIX}`,
      );
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

void bootstrap();
