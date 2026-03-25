import { prisma } from "@/lib/db";
import { UpdateSavingsGoalSchema } from "@/lib/validations/savings-goal";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const result = UpdateSavingsGoalSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const goal = await prisma.savingsGoal.findUnique({ where: { id } });
  if (!goal) {
    return NextResponse.json({ error: "Savings goal not found." }, { status: 404 });
  }

  const updated = await prisma.savingsGoal.update({
    where: { id },
    data: {
      name: result.data.name,
      targetAmount: result.data.targetAmount,
      targetDate: result.data.targetDate ? new Date(result.data.targetDate) : null,
    },
    include: {
      contributions: { select: { amount: true } },
    },
  });

  const totalContributed = updated.contributions.reduce(
    (s, c) => s + Number(c.amount),
    0
  );
  const target = Number(updated.targetAmount);

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    targetAmount: updated.targetAmount.toString(),
    targetDate: updated.targetDate,
    status: updated.status,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    totalContributed: totalContributed.toFixed(2),
    progressRatio: target > 0 ? totalContributed / target : 0,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const goal = await prisma.savingsGoal.findUnique({ where: { id } });
  if (!goal) {
    return NextResponse.json({ error: "Savings goal not found." }, { status: 404 });
  }
  await prisma.savingsGoal.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
