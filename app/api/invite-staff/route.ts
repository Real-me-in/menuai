import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getRestaurantUser,
  hasRole,
  supabaseAdmin,
} from "@/lib/server-auth";

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

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const restaurantUser = await getRestaurantUser(user.id);

    if (!restaurantUser) {
      return NextResponse.json(
        { error: "Restaurant access denied" },
        { status: 403 }
      );
    }

    if (!hasRole(restaurantUser.role, ["owner", "manager"])) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const email = body.email?.trim().toLowerCase();
    const role = body.role;

    if (!email || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("restaurant_users").insert({
      user_id: null,
      email,
      restaurant_id: restaurantUser.restaurant_id,
      role,
      active: true,
      invited_by: user.id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("invite-staff error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}