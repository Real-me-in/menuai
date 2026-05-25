import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getRestaurantUser, hasRole } from "@/lib/server-auth";

const allowedStatuses = ["served", "completed"];

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const restaurantUser = await getRestaurantUser(token);

    if (!restaurantUser) {
      return NextResponse.json(
        { error: "Restaurant user not found" },
        { status: 403 }
      );
    }

    if (!hasRole(restaurantUser.role, ["owner", "manager", "waiter"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Order ID and status are required" },
        { status: 400 }
      );
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid service status" },
        { status: 400 }
      );
    }

    const { data: existingOrder, error: fetchError } = await supabase
      .from("orders")
      .select("id, restaurant_id, status")
      .eq("id", orderId)
      .single();

    if (fetchError || !existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (existingOrder.restaurant_id !== restaurantUser.restaurant_id) {
      return NextResponse.json(
        { error: "You cannot update orders from another restaurant" },
        { status: 403 }
      );
    }

    if (status === "served" && existingOrder.status !== "ready") {
      return NextResponse.json(
        { error: "Only ready orders can be marked as served" },
        { status: 400 }
      );
    }

    if (status === "completed" && existingOrder.status !== "served") {
      return NextResponse.json(
        { error: "Only served orders can be marked as completed" },
        { status: 400 }
      );
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .eq("restaurant_id", restaurantUser.restaurant_id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}