import { prisma } from "@/lib/db";
import { CreateContributionSchema } from "@/lib/validations/contribution";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const contributions = await prisma.contribution.findMany({
    where: { savingsGoalId: id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(
    contributions.map((c) => ({ ...c, amount: c.amount.toString() }))
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const result = CreateContributionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const goal = await prisma.savingsGoal.findUnique({
    where: { id },
    include: { contributions: { select: { amount: true } } },
  });
  if (!goal) {
    return NextResponse.json({ error: "Savings goal not found." }, { status: 404 });
  }

  const contribution = await prisma.contribution.create({
    data: {
      savingsGoalId: id,
      amount: result.data.amount,
      date: result.data.date ? new Date(result.data.date) : new Date(),
    },
  });

  // Check if goal is now complete
  const newTotal =
    goal.contributions.reduce((s, c) => s + Number(c.amount), 0) +
    Number(contribution.amount);

  if (newTotal >= Number(goal.targetAmount) && goal.status === "ACTIVE") {
    await prisma.savingsGoal.update({
      where: { id },
      data: { status: "COMPLETED" },
    });
  }

  return NextResponse.json(
    { ...contribution, amount: contribution.amount.toString() },
    { status: 201 }
  );
}
