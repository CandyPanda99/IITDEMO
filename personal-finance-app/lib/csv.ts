import { unparse } from "papaparse";
import { format } from "date-fns";

interface TransactionWithCategory {
  type: string;
  category: { name: string };
  amount: string | number;
  currency: string;
  date: string | Date;
  notes?: string | null;
}

export function transactionsToCsv(
  transactions: TransactionWithCategory[]
): string {
  const rows = transactions.map((t) => ({
    type: t.type,
    category: t.category.name,
    amount: Number(t.amount).toFixed(2),
    currency: t.currency,
    date: format(new Date(t.date), "yyyy-MM-dd"),
    notes: t.notes ?? "",
  }));

  return unparse({
    fields: ["type", "category", "amount", "currency", "date", "notes"],
    data: rows,
  });
}
