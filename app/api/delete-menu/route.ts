import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { menuId, userId } = await req.json();

    if (!menuId || !userId) {
      return NextResponse.json(
        { error: "Missing menuId or userId" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("menus")
      .delete()
      .eq("id", menuId)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}