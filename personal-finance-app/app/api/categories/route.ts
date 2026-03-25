import { prisma } from "@/lib/db";
import { CreateCategorySchema } from "@/lib/validations/category";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, type: true, createdAt: true },
  });
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = CreateCategorySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { name } = result.data;
  const existing = await prisma.category.findFirst({ where: { name } });
  if (existing) {
    return NextResponse.json(
      { error: "Category with this name already exists." },
      { status: 409 }
    );
  }

  const category = await prisma.category.create({
    data: { name, type: "CUSTOM" },
  });
  return NextResponse.json(category, { status: 201 });
}
