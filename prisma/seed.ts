import bcrypt from "bcryptjs";
import { PrismaClient } from "@/app/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

async function main() {
  const hashed = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@eduflow.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@eduflow.com",
      password: hashed,
      role: "ADMIN",
    },
  });

  console.log("Admin seeded");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
