import { NextRequest, NextResponse } from "next/server";
import { geminiFlash } from "@/lib/gemini";

// Required environment variables for search grounding:
// GOOGLE_SEARCH_KEY
// GOOGLE_CX

export async function POST(req: NextRequest) {
  try {
    const { question, area } = await req.json();
    if (!question?.trim()) {
      return NextResponse.json({ error: "Question required" }, { status: 400 });
    }

    const safeArea = area || "Dhaka";
    let searchContext = "";
    let useGrounding = false;

    // STEP 1 — Web search
    const searchKey = process.env.GOOGLE_SEARCH_KEY;
    const searchCx = process.env.GOOGLE_CX;

    if (searchKey && searchCx) {
      try {
        const searchQuery = `${safeArea} Dhaka ${question}`;
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${searchKey}&cx=${searchCx}&q=${encodeURIComponent(searchQuery)}&num=5`;
        
        const searchRes = await fetch(searchUrl);
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.items && searchData.items.length > 0) {
            const snippets = searchData.items.slice(0, 3).map((item: any, index: number) => `[${index + 1}] ${item.snippet}`);
            searchContext = snippets.join("\n");
            useGrounding = true;
          }
        }
      } catch (err) {
        console.error("Google Search API error:", err);
        // Fall back gracefully to direct Gemini call
      }
    }

    // STEP 2 — Grounded generation
    let prompt = "";
    
    if (useGrounding) {
      prompt = `You are a local area expert for ${safeArea}, Dhaka, Bangladesh.
Use ONLY the following real-time web search results to answer the tenant's question.
Do not use general knowledge if these results are sufficient.

Web search results:
${searchContext}

Question: ${question}

Answer in 3-5 sentences. Be specific to ${safeArea}. If the search results don't contain 
enough information, say so clearly — do not hallucinate.`;
    } else {
      prompt = `You are a knowledgeable local area expert for Dhaka, Bangladesh.
Answer the following question about the area "${safeArea}" for someone looking to rent accommodation there.
(Note: Real-time search grounding is currently unavailable, rely on your knowledge)

Question: "${question}"

Guidelines:
- Be concise: 3-5 sentences maximum
- Be factual and helpful about: safety, transport, utilities, markets, hospitals, schools, noise levels
- If you're unsure about specific details, acknowledge it honestly
- Mention relevant nearby landmarks or facilities
- Consider the context of students and families looking for housing
- Write in clear English that is easy to understand

Answer:`;
    }

    const result = await geminiFlash.generateContent(prompt);
    const answer = result.response.text().trim();

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("neighborhood-qa error:", error);
    return NextResponse.json({ error: "Failed to get answer" }, { status: 500 });
  }
}
