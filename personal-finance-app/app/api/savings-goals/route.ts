import { prisma } from "@/lib/db";
import { CreateSavingsGoalSchema } from "@/lib/validations/savings-goal";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const goals = await prisma.savingsGoal.findMany({
    include: {
      contributions: { select: { amount: true }, orderBy: { date: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const enriched = goals.map((g) => {
    const totalContributed = g.contributions.reduce(
      (s, c) => s + Number(c.amount),
      0
    );
    const target = Number(g.targetAmount);
    return {
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount.toString(),
      targetDate: g.targetDate,
      status: g.status,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      totalContributed: totalContributed.toFixed(2),
      progressRatio: target > 0 ? totalContributed / target : 0,
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = CreateSavingsGoalSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { name, targetAmount, targetDate: deadline } = result.data;
  const goal = await prisma.savingsGoal.create({
    data: {
      name,
      targetAmount,
      targetDate: deadline ? new Date(deadline) : null,
    },
  });

  return NextResponse.json(
    {
      ...goal,
      targetAmount: goal.targetAmount.toString(),
      totalContributed: "0.00",
      progressRatio: 0,
    },
    { status: 201 }
  );
}
