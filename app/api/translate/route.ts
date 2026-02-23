import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, targetLanguage } = await req.json();

  if (!text || !targetLanguage) {
    return NextResponse.json({ error: "text and targetLanguage required" }, { status: 400 });
  }

  const prompt = targetLanguage === "sw"
    ? `Translate the following educational content from English to Kiswahili. Keep educational terms accurate. Maintain formatting. Only return the translated text, nothing else:\n\n${text}`
    : `Translate the following educational content from Kiswahili to English. Keep educational terms accurate. Maintain formatting. Only return the translated text, nothing else:\n\n${text}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
        }),
      }
    );

    const data = await response.json();
    const translated = data.candidates?.[0]?.content?.parts?.[0]?.text || text;

    return NextResponse.json({ translated });
  } catch {
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}