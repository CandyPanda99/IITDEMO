import { prisma } from "@/lib/db";
import { transactionsToCsv } from "@/lib/csv";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
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

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    include: { category: { select: { name: true } } },
  });

  const csv = transactionsToCsv(
    transactions.map((t) => ({
      ...t,
      amount: t.amount.toString(),
    }))
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="transactions.csv"',
    },
  });
}
