import { generateRecurringTransactions } from "@/lib/recurring";
import { NextResponse } from "next/server";

export async function POST() {
  const generated = await generateRecurringTransactions();
  return NextResponse.json({ generated });
}
