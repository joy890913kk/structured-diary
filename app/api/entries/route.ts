import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const month = searchParams.get("month");

    let where = {};

    if (date) {
      where = { entryDate: { gte: new Date(date + "T00:00:00"), lte: new Date(date + "T23:59:59") } };
    } else if (month) {
      const [year, monthNum] = month.split("-");
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
      where = { entryDate: { gte: startDate, lte: endDate } };
    }

    const entries = await prisma.entry.findMany({
      where,
      include: { category: true, item: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(entries);
  } catch (err: any) {
    console.error("GET /api/entries failed:", err);
    return NextResponse.json(
      { error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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
  } catch (err: any) {
    console.error("POST /api/entries failed:", err);
    return NextResponse.json(
      { error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
