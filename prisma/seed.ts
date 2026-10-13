import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { DEFAULT_CATEGORIES, type CategoryDef } from "../src/lib/default-categories";
import { generateDemoData } from "./demo-data";

// Creates (or finds) a demo account and loads generated sample data into it.
// Dates are relative to "today" so the dashboard always has a sensible current month.
//
//   npx prisma db seed          -> import only if the demo user has no data yet
//   tsx prisma/seed.ts --reset  -> wipe the demo user's data, then import
//   npm run seed                -> same as --reset
//
// Demo login (override in .env with SEED_USER_EMAIL / SEED_USER_PASSWORD):
//   alex@example.com / demo12345

const DEMO_EMAIL = (process.env.SEED_USER_EMAIL ?? "alex@example.com").trim().toLowerCase();
const DEMO_NAME = process.env.SEED_USER_NAME ?? "Alex Morgan";
const DEMO_PASSWORD = process.env.SEED_USER_PASSWORD ?? "demo12345";

const DEMO_CUSTOM_CATEGORIES: CategoryDef[] = [
  { value: "gym-membership", label: "Gym Membership", kind: "expense", iconName: "Dumbbell", iconBg: "bg-emerald-100", iconColor: "text-emerald-500", color: "#7c5cbf" },
  { value: "side-hustle", label: "Side Hustle", kind: "income", iconName: "Sparkles", iconBg: "bg-lime-100", iconColor: "text-lime-600", color: "var(--primary)" },
];

async function ensureDemoUser() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  if (!existing) {
    return prisma.user.create({
      data: { email: DEMO_EMAIL, name: DEMO_NAME, passwordHash, emailVerified: new Date() },
    });
  }

  const shouldSetPassword = !existing.passwordHash || Boolean(process.env.SEED_USER_PASSWORD);
  return prisma.user.update({
    where: { id: existing.id },
    data: shouldSetPassword
      ? { passwordHash, emailVerified: existing.emailVerified ?? new Date() }
      : {},
  });
}

async function main() {
  const reset = process.argv.includes("--reset");

  const user = await ensureDemoUser();

  if (reset) {
    await prisma.transaction.deleteMany({ where: { userId: user.id } });
    await prisma.budget.deleteMany({ where: { userId: user.id } });
    await prisma.category.deleteMany({ where: { userId: user.id } });
  }

  if ((await prisma.category.count({ where: { userId: user.id } })) === 0) {
    const categories = [
      ...DEFAULT_CATEGORIES.map((c) => ({ ...c, custom: false })),
      ...DEMO_CUSTOM_CATEGORIES.map((c) => ({ ...c, custom: true })),
    ];
    await prisma.category.createMany({
      data: categories.map((c, position) => ({ userId: user.id, ...c, position })),
    });
    console.log(`Created ${categories.length} categories for ${user.email}.`);
  }

  const hasData = (await prisma.transaction.count({ where: { userId: user.id } })) > 0;
  if (hasData) {
    console.log("Demo user already has data, skipping seed (use --reset to replace it).");
    return;
  }

  const { transactions, budgets } = generateDemoData();

  await prisma.transaction.createMany({
    data: transactions.map((t) => ({
      id: t.id,
      userId: user.id,
      name: t.name,
      note: t.note,
      date: t.date,
      amountCents: Math.round(t.amount * 100),
      type: t.type,
      category: t.category,
    })),
  });

  await prisma.budget.createMany({
    data: Object.entries(budgets).flatMap(([month, cats]) =>
      Object.entries(cats).map(([category, amount]) => ({
        userId: user.id,
        month,
        category,
        amountCents: Math.round(amount * 100),
      })),
    ),
  });

  console.log(
    `Seeded ${transactions.length} transactions and ${Object.keys(budgets).length} budget months for ${user.email}.`,
  );
  if (!process.env.SEED_USER_PASSWORD) {
    console.log(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
