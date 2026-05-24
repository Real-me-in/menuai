import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const slug = body.slug;
    const question = body.question;

    if (!question) {
      return Response.json({
        answer: "Please ask me a question about the menu.",
      });
    }

    let menuData = body.menuData;
    let restaurantName = "this restaurant";

    if (slug) {
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      const { data: menu } = await supabase
        .from("menus")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      restaurantName =
        restaurant?.name ||
        menu?.restaurant_name ||
        menu?.name ||
        "this restaurant";

      menuData = menu?.menu_data || body.menuData;
    }

    if (!menuData) {
      return Response.json({
        answer: "I could not find the menu for this restaurant.",
      });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are a friendly AI waiter for ${restaurantName}. 
Answer customer questions only using the provided menu.
Keep answers short, helpful, and polite.
If an item is not on the menu, clearly say it is not available.`,
        },
        {
          role: "user",
          content: `
MENU:
${JSON.stringify(menuData)}

CUSTOMER QUESTION:
${question}
`,
        },
      ],
      temperature: 0.5,
    });

    return Response.json({
      answer:
        completion.choices[0]?.message?.content ||
        "Sorry, I could not answer that.",
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        answer: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}