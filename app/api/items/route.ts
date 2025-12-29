import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");

  const items = await prisma.item.findMany({
    where: categoryId ? { categoryId } : undefined,
    orderBy: { order: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { categoryId, name } = body;

  const maxOrder = await prisma.item.aggregate({
    _max: { order: true },
    where: { categoryId },
  });

  const item = await prisma.item.create({
    data: {
      name,
      categoryId,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  return NextResponse.json(item);
}
