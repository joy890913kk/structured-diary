import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const categories = await prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        items: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: { order: "asc" }
        }
      },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(categories);
  } catch (err: any) {
    console.error("GET /api/categories failed:", err);
    return NextResponse.json(
      { error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, color } = body;

    const maxOrder = await prisma.category.aggregate({
      _max: { order: true },
    });

    const category = await prisma.category.create({
      data: {
        name,
        color,
        order: (maxOrder._max.order ?? 0) + 1,
      },
      include: { items: true },
    });

    return NextResponse.json(category);
  } catch (err: any) {
    console.error("POST /api/categories failed:", err);
    return NextResponse.json(
      { error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
