import { addMonths, addWeeks, addYears, endOfMonth, min } from "date-fns";
import { prisma } from "@/lib/db";

export async function generateRecurringTransactions(): Promise<number> {
  const now = new Date();
  const parents = await prisma.transaction.findMany({
    where: {
      isRecurring: true,
      recurringNextDate: { lte: now },
    },
  });

  let created = 0;
  for (const parent of parents) {
    if (!parent.recurringNextDate || !parent.recurringFrequency) continue;

    await prisma.transaction.create({
      data: {
        type: parent.type,
        amount: parent.amount,
        currency: parent.currency,
        categoryId: parent.categoryId,
        notes: parent.notes,
        isRecurring: false,
        recurringFrequency: null,
        recurringNextDate: null,
        recurringParentId: parent.id,
        date: parent.recurringNextDate,
      },
    });

    const current = parent.recurringNextDate;
    let nextDate: Date;
    if (parent.recurringFrequency === "WEEKLY") {
      nextDate = addWeeks(current, 1);
    } else if (parent.recurringFrequency === "MONTHLY") {
      const computed = addMonths(current, 1);
      // Clamp to end-of-month if the source day exceeds days in target month
      nextDate = min([computed, endOfMonth(computed)]);
    } else {
      nextDate = addYears(current, 1);
    }

    await prisma.transaction.update({
      where: { id: parent.id },
      data: { recurringNextDate: nextDate },
    });

    created++;
  }

  return created;
}
