import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { items: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, color } = body;

  const maxOrder = await prisma.category.aggregate({
    _max: { order: true },
  });

  const category = await prisma.category.create({
    data: {
      name,
      color: color || null,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });
  return NextResponse.json(category);
}
