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

    if (!hasRole(restaurantUser.role, ["owner", "manager"])) {
      return NextResponse.json(
        { error: "Only owners or managers can delete menus" },
        { status: 403 }
      );
    }

    const { menuId } = await req.json();

    if (!menuId) {
      return NextResponse.json(
        { error: "Missing menuId" },
        { status: 400 }
      );
    }

    const { data: menuData, error: menuFetchError } =
      await supabaseAdmin
        .from("menus")
        .select("id, slug, restaurant_id")
        .eq("id", menuId)
        .maybeSingle();

    if (menuFetchError || !menuData) {
      return NextResponse.json(
        { error: "Menu not found" },
        { status: 404 }
      );
    }

    if (menuData.restaurant_id !== restaurantUser.restaurant_id) {
      return NextResponse.json(
        { error: "Cannot delete another restaurant's menu" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("menus")
      .delete()
      .eq("id", menuId)
      .eq("restaurant_id", restaurantUser.restaurant_id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedMenuId: menuId,
      slug: menuData.slug,
    });
  } catch (error: any) {
    console.error("Delete menu error:", error);

    return NextResponse.json(
      { error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}