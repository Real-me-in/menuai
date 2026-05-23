import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabase } from "@/lib/supabase";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function createSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      restaurantName,
      menuText,
      userId,
      logoUrl,
      bannerUrl,
      themeColor,
    } = body;

    const finalUserId = 
      userId || "00000000-0000-0000-0000-000000000000";

    const completion = await groq.chat.completions.create({
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

    let result = completion.choices[0]?.message?.content || "";

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
  console.log("RAW AI RESPONSE:", result);
  parsedMenu = JSON.parse(result);
} catch (parseError) {
  console.error("JSON PARSE ERROR:", parseError);
  console.error("FAILED AI RESPONSE:", result);

  return NextResponse.json(
    {
      error: "Could not convert JSON into menu cards. Try clicking Generate again.",
      raw: result,
    },
    { status: 500 }
  );
}
    const slug = createSlug(restaurantName);

    const { error } = await supabase.from("menus").upsert(
      {
        slug,
        restaurant_name: restaurantName,
        menu_data: parsedMenu,
        user_id: finalUserId,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        theme_color: themeColor || "#16a34a",
      },
      {
        onConflict: "slug",
      }
    );

    if (error) {
      console.error("Supabase save error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      result,
      slug,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}