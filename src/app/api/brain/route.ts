import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const apiKey = process.env.GROQ_API_KEY || "";

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.4,
      max_completion_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const data = await response.json();
  return NextResponse.json({ answer: data.choices[0].message.content });
}
