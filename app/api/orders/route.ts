import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getRestaurantUser,
  hasRole,
  supabaseAdmin,
} from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const restaurantUser = await getRestaurantUser(user.id);

    if (!restaurantUser) {
      return NextResponse.json(
        { error: "Restaurant access denied" },
        { status: 403 }
      );
    }

    if (
      !hasRole(restaurantUser.role, [
        "owner",
        "manager",
        "cashier",
        "kitchen",
        "waiter",
      ])
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantUser.restaurant_id)
      .not("status", "eq", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error("orders GET error:", err);

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}