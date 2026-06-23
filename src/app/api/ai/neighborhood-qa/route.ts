import { NextRequest, NextResponse } from "next/server";
import { geminiFlash } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { question, area } = await req.json();
    if (!question?.trim()) {
      return NextResponse.json({ error: "Question required" }, { status: 400 });
    }

    const prompt = `You are a knowledgeable local area expert for Dhaka, Bangladesh.
Answer the following question about the area "${area || "Dhaka"}" for someone looking to rent accommodation there.

Question: "${question}"

Guidelines:
- Be concise: 3-5 sentences maximum
- Be factual and helpful about: safety, transport, utilities, markets, hospitals, schools, noise levels
- If you're unsure about specific details, acknowledge it honestly
- Mention relevant nearby landmarks or facilities
- Consider the context of students and families looking for housing
- Write in clear English that is easy to understand

Answer:`;

    const result = await geminiFlash.generateContent(prompt);
    const answer = result.response.text().trim();

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("neighborhood-qa error:", error);
    return NextResponse.json({ error: "Failed to get answer" }, { status: 500 });
  }
}
