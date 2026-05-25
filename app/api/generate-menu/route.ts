import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabase } from "@/lib/supabase";
import {
  getRestaurantUser,
  hasRole,
  supabaseAdmin,
} from "@/lib/server-auth";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

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

    const body = await req.json();

    const {
      restaurantName,
      menuText,
      logoUrl,
      bannerUrl,
      themeColor,
    } = body;

    if (!restaurantName || !menuText) {
      return NextResponse.json(
        { error: "Missing restaurantName or menuText" },
        { status: 400 }
      );
    }

    const slug = createSlug(restaurantName);

    // Find existing restaurant
    const { data: existingRestaurant } =
      await supabaseAdmin
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

    let restaurantId: string;

    // Existing restaurant flow
    if (existingRestaurant) {
      const restaurantUser =
        await getRestaurantUser(user.id);

      if (!restaurantUser) {
        return NextResponse.json(
          { error: "Restaurant access denied" },
          { status: 403 }
        );
      }

      if (
        restaurantUser.restaurant_id !==
        existingRestaurant.id
      ) {
        return NextResponse.json(
          {
            error:
              "This restaurant belongs to another tenant.",
          },
          { status: 403 }
        );
      }

      if (
        !hasRole(restaurantUser.role, [
          "owner",
          "manager",
        ])
      ) {
        return NextResponse.json(
          {
            error:
              "Only owners or managers can modify menus.",
          },
          { status: 403 }
        );
      }

      restaurantId = existingRestaurant.id;
    } else {
      // Create new restaurant
      const { data: newRestaurant, error } =
        await supabaseAdmin
          .from("restaurants")
          .insert({
            slug,
            name: restaurantName,
            owner_id: user.id,
            logo_url: logoUrl || null,
            banner_url: bannerUrl || null,
          })
          .select()
          .single();

      if (error || !newRestaurant) {
        return NextResponse.json(
          {
            error:
              error?.message ||
              "Failed to create restaurant",
          },
          { status: 500 }
        );
      }

      restaurantId = newRestaurant.id;

      // Create owner role
      await supabaseAdmin
        .from("restaurant_users")
        .upsert(
          {
            restaurant_id: restaurantId,
            user_id: user.id,
            role: "owner",
            active: true,
          },
          {
            onConflict: "restaurant_id,user_id",
          }
        );
    }

    // Generate menu AI
    const completion =
      await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `
You are a restaurant menu AI.

Convert raw menu text into valid JSON.

Return ONLY valid JSON.

Format:

{
  "restaurantName": "",
  "sections": [
    {
      "name": "",
      "items": [
        {
          "name": "",
          "price": "",
          "description": "",
          "tags": []
        }
      ]
    }
  ]
}
            `,
          },
          {
            role: "user",
            content: `
Restaurant Name:
${restaurantName}

Menu:
${menuText}
            `,
          },
        ],
      });

    let result =
      completion.choices[0]?.message?.content || "";

    result = result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const start = result.indexOf("{");
    const end = result.lastIndexOf("}");

    if (start !== -1 && end !== -1) {
      result = result.substring(start, end + 1);
    }

    let parsedMenu;

    try {
      parsedMenu = JSON.parse(result);
    } catch {
      return NextResponse.json(
        {
          error:
            "Could not convert JSON into menu cards.",
          raw: result,
        },
        { status: 500 }
      );
    }

    // Save menu securely
    const { error: menuError } =
      await supabaseAdmin
        .from("menus")
        .upsert(
          {
            restaurant_id: restaurantId,
            slug,
            restaurant_name: restaurantName,
            menu_data: parsedMenu,
            user_id: user.id,
            logo_url: logoUrl || null,
            banner_url: bannerUrl || null,
            theme_color:
              themeColor || "#16a34a",
          },
          {
            onConflict: "slug",
          }
        );

    if (menuError) {
      return NextResponse.json(
        { error: menuError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      slug,
      restaurantId,
    });
  } catch (error: any) {
    console.error(
      "Generate menu error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Something went wrong.",
      },
      { status: 500 }
    );
  }
}