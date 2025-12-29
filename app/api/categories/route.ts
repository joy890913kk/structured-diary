import { NextResponse } from "next/server";

export async function GET() {
  try {
    // TODO: 之後在這裡接 supabase
    // const { data, error } = await supabase.from("categories").select("*");
    // if (error) throw error;

    const data: any[] = []; // 先回空陣列，確保 API 不會炸
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("GET /api/categories failed:", err);
    return NextResponse.json(
      { error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
