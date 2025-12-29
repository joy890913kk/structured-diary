import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, parseISO } from "date-fns";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const date = searchParams.get("date");

  let where: Record<string, unknown> = {};

  if (month) {
    const base = parseISO(`${month}-01`);
    where = {
      entryDate: {
        gte: startOfMonth(base),
        lte: endOfMonth(base),
      },
    };
  }

  if (date) {
    const day = parseISO(date);
    where = {
      entryDate: {
        gte: day,
        lte: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59),
      },
    };
  }

  const entries = await prisma.entry.findMany({
    where,
    include: { category: true, item: true },
    orderBy: { entryDate: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { entryDate, categoryId, itemId, content } = body;

  const entry = await prisma.entry.create({
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
