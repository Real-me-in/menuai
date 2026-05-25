import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user?.email) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const email = user.email.trim().toLowerCase();

    console.log("Claiming invite for:", email, user.id);

    const { data, error } = await supabaseAdmin
      .from("restaurant_users")
      .update({
        user_id: user.id,
        active: true,
      })
      .eq("email", email)
      .is("user_id", null)
      .select();

    if (error) {
      console.error("Claim invite database error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Claim invite result:", data);

    return NextResponse.json({
      success: true,
      linked: data,
    });
  } catch (err: any) {
    console.error("claim-staff-invite fatal error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}