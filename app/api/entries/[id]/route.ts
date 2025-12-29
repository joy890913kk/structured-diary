import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { entryDate, categoryId, itemId, content } = body;

  const entry = await prisma.entry.update({
    where: { id: params.id },
    data: {
      entryDate: new Date(entryDate),
      categoryId,
      itemId,
      content,
    },
    include: { category: true, item: true },
  });

  return NextResponse.json(entry);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await prisma.entry.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
