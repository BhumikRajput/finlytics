/**
 * Deterministic demo transactions and budgets relative to today's calendar date.
 * Used by prisma/seed.ts so charts always include the current month without
 * checking JSON into the repo.
 */

export type DemoTransaction = {
  id: string;
  name: string;
  note: string;
  date: string;
  amount: number;
  type: "income" | "expense";
  category: string;
};

export type DemoBudgets = Record<string, Record<string, number>>;

const MONTHS = 8;
const SEED = 42;

const labels: Record<string, string> = {
  food: "Food",
  travel: "Travel",
  rent: "Rent",
  shopping: "Shopping",
  entertainment: "Entertainment",
  bills: "Bills",
  others: "Others",
  "gym-membership": "Gym Membership",
  salary: "Salary",
  freelance: "Freelance",
  investment: "Investment",
  other: "Others",
  "side-hustle": "Side Hustle",
};

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateDemoData(): { transactions: DemoTransaction[]; budgets: DemoBudgets } {
  const rand = mulberry32(SEED);
  const between = (min: number, max: number) => min + rand() * (max - min);
  const money = (n: number) => Math.round(n * 100) / 100;
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const chance = (p: number) => rand() < p;
  const int = (min: number, max: number) => Math.floor(between(min, max + 1));

  const pad = (n: number) => String(n).padStart(2, "0");
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const raw: Omit<DemoTransaction, "id">[] = [];

  function add(
    year: number,
    month: number,
    day: number,
    category: string,
    type: "income" | "expense",
    amount: number,
    note = "",
  ) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const d = Math.min(Math.max(1, day), daysInMonth);
    const date = `${year}-${pad(month)}-${pad(d)}`;
    if (date > todayISO) return;
    raw.push({
      name: labels[category],
      note,
      date,
      amount: type === "income" ? money(amount) : -money(amount),
      type,
      category,
    });
  }

  const monthKeys: string[] = [];

  for (let i = MONTHS - 1; i >= 0; i--) {
    const first = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = first.getFullYear();
    const m = first.getMonth() + 1;
    monthKeys.push(`${y}-${pad(m)}`);

    add(y, m, 1, "salary", "income", 5000, "Monthly pay");
    if (chance(0.65))
      add(y, m, int(5, 12), "freelance", "income", between(400, 1800), pick(["Logo design", "Website copy", "Landing page", "Consulting"]));
    if (chance(0.35))
      add(y, m, int(12, 25), "freelance", "income", between(250, 900), pick(["Brand audit", "Social posts"]));
    if (chance(0.5)) add(y, m, int(14, 28), "investment", "income", between(80, 300), "Dividend");
    if (chance(0.4))
      add(y, m, int(8, 26), "side-hustle", "income", between(100, 400), pick(["Weekend gig", "Resale"]));
    if (chance(0.3)) add(y, m, int(10, 28), "other", "income", between(10, 40), "Cashback reward");

    add(y, m, 2, "rent", "expense", 1200);
    add(y, m, 5, "gym-membership", "expense", 39.99, "Monthly membership");
    add(y, m, int(8, 12), "bills", "expense", between(85, 140), "Electricity");
    add(y, m, 15, "bills", "expense", 59.99, "Internet");
    add(y, m, int(18, 22), "bills", "expense", between(30, 48), pick(["Water", "Phone"]));

    const groceryRuns = int(3, 5);
    for (let g = 0; g < groceryRuns; g++) {
      add(y, m, 3 + g * 7 + int(0, 2), "food", "expense", between(55, 115), "Weekly shop");
    }
    const diningOut = int(2, 4);
    for (let g = 0; g < diningOut; g++) {
      add(y, m, int(4, 28), "food", "expense", between(14, 48), pick(["Dinner out", "Lunch", "Coffee and snacks", "Takeaway"]));
    }

    const shopping = int(1, 3);
    for (let g = 0; g < shopping; g++) {
      add(y, m, int(3, 27), "shopping", "expense", between(30, 190), pick(["New shoes", "Jacket", "Home stuff", "Headphones", "Books"]));
    }
    const fun = int(1, 3);
    for (let g = 0; g < fun; g++) {
      add(y, m, int(4, 28), "entertainment", "expense", between(12, 85), pick(["Movie night", "Concert tickets", "Streaming", "Game night"]));
    }
    if (chance(0.4))
      add(y, m, int(6, 24), "travel", "expense", between(150, 450), pick(["Weekend trip", "Train tickets", "Flight"]));
    if (chance(0.6))
      add(y, m, int(5, 27), "others", "expense", between(10, 80), pick(["Gift", "Pharmacy", "Haircut", "Miscellaneous"]));
  }

  raw.sort((a, b) => b.date.localeCompare(a.date));
  const transactions = raw.map((t, i) => ({ id: `t${i + 1}`, ...t }));

  const baseBudget = {
    rent: 1200,
    food: 600,
    shopping: 300,
    entertainment: 200,
    bills: 300,
    travel: 200,
    others: 100,
    "gym-membership": 40,
  };

  const budgets: DemoBudgets = {};
  budgets[monthKeys[0]] = { ...baseBudget };
  if (monthKeys.length > 4) {
    budgets[monthKeys[3]] = { ...baseBudget, food: 650, shopping: 350 };
  }
  if (monthKeys.length > 1) {
    budgets[monthKeys[monthKeys.length - 1]] = {
      ...baseBudget,
      food: 650,
      shopping: 350,
      entertainment: 250,
    };
  }

  return { transactions, budgets };
}
