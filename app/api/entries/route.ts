import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // 先從 query string 拿 month（即使現在不用）
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    // TODO: 之後在這裡接 supabase 查 entries
    // const { data, error } = await supabase
    //   .from("entries")
    //   .select("*")
    //   .eq("month", month);
    // if (error) throw error;

    const data: any[] = []; // 先回空陣列，保證不炸
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("GET /api/entries failed:", err);
    return NextResponse.json(
      { error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
