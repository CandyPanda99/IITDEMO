import path from "path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient, CategoryType } from "@prisma/client";

const dbPath = path.join(process.cwd(), "prisma/dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const DEFAULT_CATEGORIES = [
  "Housing",
  "Food & Dining",
  "Transport",
  "Utilities",
  "Healthcare",
  "Entertainment",
  "Shopping",
  "Education",
  "Income",
  "Other",
];

async function main() {
  console.log("Seeding default categories...");
  for (const name of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, type: CategoryType.DEFAULT },
    });
  }
  console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
