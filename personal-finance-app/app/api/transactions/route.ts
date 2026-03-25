import { prisma } from "@/lib/db";
import { CreateTransactionSchema } from "@/lib/validations/transaction";
import { addMonths, addWeeks, addYears, endOfMonth, min } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

function buildWhereClause(searchParams: URLSearchParams) {
  const categoryId = searchParams.get("categoryId");
  const type = searchParams.get("type") as "INCOME" | "EXPENSE" | null;
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const where: Record<string, unknown> = {};
  if (categoryId) where["categoryId"] = categoryId;
  if (type) where["type"] = type;
  if (dateFrom || dateTo) {
    where["date"] = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }
  return where;
}

export async function GET(request: NextRequest) {
  const where = buildWhereClause(request.nextUrl.searchParams);
  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    include: { category: { select: { id: true, name: true } } },
  });

  const serialized = transactions.map((t) => ({
    ...t,
    amount: t.amount.toString(),
  }));
  return NextResponse.json(serialized);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = CreateTransactionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const data = result.data;
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  let recurringNextDate: Date | null = null;
  if (data.isRecurring && data.recurringFrequency) {
    const base = data.date;
    if (data.recurringFrequency === "WEEKLY") {
      recurringNextDate = addWeeks(base, 1);
    } else if (data.recurringFrequency === "MONTHLY") {
      const computed = addMonths(base, 1);
      recurringNextDate = min([computed, endOfMonth(computed)]);
    } else {
      recurringNextDate = addYears(base, 1);
    }
  }

  const transaction = await prisma.transaction.create({
    data: {
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      categoryId: data.categoryId,
      date: data.date,
      notes: data.notes,
      isRecurring: data.isRecurring,
      recurringFrequency: data.recurringFrequency ?? null,
      recurringNextDate,
    },
    include: { category: { select: { id: true, name: true } } },
  });

  return NextResponse.json(
    { ...transaction, amount: transaction.amount.toString() },
    { status: 201 }
  );
}
