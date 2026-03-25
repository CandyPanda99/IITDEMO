import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const transactionCount = await prisma.transaction.count({
    where: { categoryId: id },
  });
  if (transactionCount > 0) {
    return NextResponse.json(
      {
        error:
          "Category has assigned transactions. Reassign or delete them first.",
      },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
