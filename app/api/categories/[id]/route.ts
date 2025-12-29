import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { name, color, isActive, order } = body;

  const category = await prisma.category.update({
    where: { id: params.id },
    data: {
      name,
      color,
      isActive,
      order,
    },
  });

  return NextResponse.json(category);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await prisma.category.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
