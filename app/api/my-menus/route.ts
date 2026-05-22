import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User not logged in." },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("menus")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ menus: data });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}