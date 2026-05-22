import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const menuData = body.menuData;
    const question = body.question;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful restaurant waiter AI. Answer customer questions using only the provided menu. Keep answers short and friendly.",
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
      answer: completion.choices[0]?.message?.content,
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