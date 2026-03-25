import { prisma } from "@/lib/db";
import { EditTransactionSchema } from "@/lib/validations/transaction";
import { addMonths, addWeeks, addYears, endOfMonth, min } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const result = EditTransactionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  }

  const { scope, ...updateData } = result.data;

  // Compute new recurringNextDate if needed
  let recurringNextDate = existing.recurringNextDate;
  if (updateData.isRecurring !== undefined || updateData.recurringFrequency !== undefined || updateData.date !== undefined) {
    const isRecurring = updateData.isRecurring ?? existing.isRecurring;
    const frequency = updateData.recurringFrequency ?? existing.recurringFrequency;
    const baseDate = updateData.date ?? existing.date;
    if (isRecurring && frequency) {
      if (frequency === "WEEKLY") recurringNextDate = addWeeks(baseDate, 1);
      else if (frequency === "MONTHLY") {
        const computed = addMonths(baseDate, 1);
        recurringNextDate = min([computed, endOfMonth(computed)]);
      } else recurringNextDate = addYears(baseDate, 1);
    } else if (!isRecurring) {
      recurringNextDate = null;
    }
  }

  const prismaUpdateData = {
    ...(updateData.type !== undefined && { type: updateData.type }),
    ...(updateData.amount !== undefined && { amount: updateData.amount }),
    ...(updateData.currency !== undefined && { currency: updateData.currency }),
    ...(updateData.categoryId !== undefined && { categoryId: updateData.categoryId }),
    ...(updateData.date !== undefined && { date: updateData.date }),
    ...(updateData.notes !== undefined && { notes: updateData.notes }),
    ...(updateData.isRecurring !== undefined && { isRecurring: updateData.isRecurring }),
    ...(updateData.recurringFrequency !== undefined && { recurringFrequency: updateData.recurringFrequency }),
    recurringNextDate,
  };

  if (scope === "this-and-future") {
    await prisma.transaction.updateMany({
      where: {
        recurringParentId: existing.recurringParentId ?? id,
        date: { gte: existing.date },
      },
      data: prismaUpdateData,
    });
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: prismaUpdateData,
    include: { category: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ ...updated, amount: updated.amount.toString() });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  }
  await prisma.transaction.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
