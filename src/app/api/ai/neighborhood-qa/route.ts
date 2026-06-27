import { NextRequest, NextResponse } from "next/server";
import { geminiFlash } from "@/lib/gemini";

type QuestionKey = "safety" | "market" | "wifi" | "hospital" | "transport";

const POPULAR_AREAS_QAS: Record<string, Record<QuestionKey, string>> = {
  "bashundhara r/a": {
    safety: "Bashundhara R/A is one of the safest residential areas in Dhaka. It is a gated community with security checkpoints at all gates, active security guards patrolling, and CCTV monitoring.",
    market: "The primary shopping hub is Mehdi Mart and various pocket markets in different blocks. For larger shopping needs, Jamuna Future Park (one of South Asia's largest malls) is located right at the entrance of Bashundhara R/A.",
    wifi: "Popular local ISPs in Bashundhara R/A include Amber IT, Circle Network, Carnival Internet, and Link3. Speed is generally excellent with fiber optic connectivity.",
    hospital: "Evercare Hospital Dhaka (a world-class multidisciplinary hospital) is located within Bashundhara R/A in Block E. For emergencies, Bashundhara Eye Hospital and other local clinics are also nearby.",
    transport: "Rickshaws are the main transport inside the residential area. For commuting outside, you can find auto-rickshaws, public buses, and ride-sharing services (Uber/Pathao) at the main gate."
  },
  "dhanmondi": {
    safety: "Dhanmondi is highly safe and well-established, with active police patrols, private security for most apartment buildings, and well-lit streets, making it comfortable for students and families alike.",
    market: "Rapa Plaza, Shimanto Square (Rifles Square), and Metro Shopping Mall are key shopping hubs. There are also numerous local grocery markets (raw markets) and supermarkets like Shwapno and Agora.",
    wifi: "Major ISPs include Link3, Carnival Internet, Amber IT, and Dot Internet. Fiber optic lines are standard across all blocks.",
    hospital: "Labaid Specialized Hospital, Ibn Sina Hospital, and Bangladesh Medical College Hospital are all located within Dhanmondi, providing top-tier medical facilities.",
    transport: "Highly accessible by public buses, rickshaws, and ride-sharing services. Metro rail stations (in nearby Farmgate/Karwan Bazar) are also reachable."
  },
  "mirpur-1": {
    safety: "Mirpur-1 is generally safe and bustling with activity. Like any crowded urban area, caution is advised on streets late at night, but residential lanes are secure.",
    market: "Mirpur-1 Muktijoddha Market is a major shopping area for fresh groceries and household goods. Mirpur City Center and Tokyo Square (in nearby Japan Garden City) are also close by.",
    wifi: "Local ISPs like Circle Network, Dot Internet, and Link3 provide extensive fiber coverage with high speeds.",
    hospital: "Delta Hospital and Mirpur General Hospital are the closest major medical centers. Kidney Foundation Hospital is also nearby.",
    transport: "Mirpur-1 is a major transport hub. Buses to all parts of Dhaka, rickshaws, auto-rickshaws, and ride-sharing are readily available."
  },
  "mirpur-2": {
    safety: "Mirpur-2 is a peaceful residential and commercial area, home to the National Cricket Stadium. It is safe with regular patrols and security guards in housing blocks.",
    market: "Mirpur-2 raw market (Kacha Bazar) is the go-to place for groceries. Shopping complexes like Mirpur Shopping Center and various retail shops line the main roads.",
    wifi: "ISP services like Circle Network, Dot Internet, and Link3 offer solid fiber connection packages.",
    hospital: "Heart Foundation Hospital, National Kidney Foundation, and various local clinics offer prompt medical services.",
    transport: "Accessible via the MRT Line 6 (Mirpur-2 is near Mirpur-10 and Mirpur-12 Metro Stations), public buses, and rickshaws."
  },
  "mirpur-10": {
    safety: "Mirpur-10 is a major transit circle and very crowded. It is generally safe due to high activity and police presence, but be mindful of pickpockets in busy crowds.",
    market: "Mirpur-10 Shomobay Bazar is famous for clothing and electronics. There are also numerous grocery markets and supermarkets.",
    wifi: "Dot Internet, Circle Network, and local cable operators provide fast, affordable fiber broadband.",
    hospital: "Al-Helal Specialized Hospital and Hope Hospital are situated nearby.",
    transport: "The Mirpur-10 Metro Rail Station connects you to Motijheel and Uttara in minutes. Extensive bus routes, rickshaws, and auto-rickshaws are available."
  },
  "uttara": {
    safety: "Uttara is a planned, highly safe, and quiet residential neighborhood. It is well-organized with sector-based security gates and active community patrols.",
    market: "Rajuk Commercial Complex, Aarong, and various Sector Markets (e.g., Sector 3, 7, 11 markets) provide everything from groceries to high-end shopping.",
    wifi: "Amber IT, Link3, Dot Internet, and Carnival Internet are highly active ISPs offering premium speeds.",
    hospital: "Uttara Adhunik Medical College Hospital, Kuwait Bangladesh Friendship Government Hospital, and Shin Shin Japan Hospital are key facilities.",
    transport: "The Dhaka Metro Rail (MRT Line 6) has multiple stations in Uttara (Uttara North, Center, South). Buses, rickshaws, and airport transport are highly accessible."
  },
  "mohammadpur": {
    safety: "Mohammadpur has a mix of quiet residential zones (like Kaderabad Housing, Japan Garden City) and busy areas. Gated housing societies are highly safe, though precaution is recommended on busier streets at night.",
    market: "Mohammadpur Town Hall Market is one of Dhaka's most famous markets for fresh food, clothing, and household items. Tokyo Square Mall is also a major shopping attraction.",
    wifi: "Dot Internet, Link3, and local providers like Circle Network offer reliable fiber optic plans.",
    hospital: "Bangladesh Specialized Hospital and Care Medical College Hospital are prime facilities. Al-Manar Hospital and local clinics are also close.",
    transport: "Connects easily to Dhanmondi, Shyamoli, and central Dhaka via public buses, rickshaws, and ride-sharing."
  },
  "gazipur": {
    safety: "Gazipur is an industrial/educational hub (near IUT and DUET). It is safe around the university campuses and major residential pockets, though industrial zones can get crowded.",
    market: "Gazipur Chowrasta and Boardbazar are the main commercial areas with large markets, supermarkets, and local grocery options.",
    wifi: "Amber IT, Link3, and specialized local student ISPs around the IUT and DUET campuses.",
    hospital: "Shaheed Tajuddin Ahmad Medical College Hospital and local specialized clinics are available for healthcare.",
    transport: "Inter-district buses, local tempo/auto-rickshaws, and train services from Gazipur station."
  }
};

function getQuestionKey(question: string): QuestionKey | null {
  const q = question.toLowerCase();
  if (q.includes("safe") || q.includes("safety")) return "safety";
  if (q.includes("market") || q.includes("grocer") || q.includes("shop") || q.includes("store") || q.includes("mall")) return "market";
  if (q.includes("wifi") || q.includes("internet") || q.includes("isp") || q.includes("broadband") || q.includes("net")) return "wifi";
  if (q.includes("hospital") || q.includes("medical") || q.includes("doctor") || q.includes("clinic") || q.includes("treatment")) return "hospital";
  if (q.includes("transport") || q.includes("bus") || q.includes("rickshaw") || q.includes("commute") || q.includes("metro") || q.includes("auto")) return "transport";
  return null;
}

function getFallbackAnswer(area: string, key: QuestionKey): string {
  switch (key) {
    case "safety":
      return `The ${area} area is generally safe and welcoming. Most residential buildings have security guards, and the neighborhood maintains a good security profile.`;
    case "market":
      return `For daily essentials, there are several local markets and grocery shops in ${area}. Supermarkets like Shwapno or Daily Shopping are also present in or near the neighborhood.`;
    case "wifi":
      return `Fiber optic broadband is standard in ${area}. Major ISPs and local operators provide stable high-speed connections suitable for students and remote work.`;
    case "hospital":
      return `There are pharmacies and local clinics located within ${area}. For specialized treatment, major hospitals are reachable within a short commute.`;
    case "transport":
      return `Transport in ${area} is convenient, with rickshaws and auto-rickshaws readily available for local travel, and public bus stands nearby for longer journeys.`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { question, area } = await req.json();
    if (!question?.trim()) {
      return NextResponse.json({ error: "Question required" }, { status: 400 });
    }

    const safeArea = area || "Dhaka";
    const questionKey = getQuestionKey(question);
    
    // Step 1: Check if we have a hardcoded answer for this area & question
    if (questionKey) {
      const normalizedArea = safeArea.toLowerCase().trim();
      const matchedAreaKey = Object.keys(POPULAR_AREAS_QAS).find(k => 
        normalizedArea.includes(k) || k.includes(normalizedArea)
      );

      if (matchedAreaKey) {
        const answer = POPULAR_AREAS_QAS[matchedAreaKey][questionKey];
        return NextResponse.json({ answer });
      }
    }

    // Step 2: Fall back to Google Search + Gemini (or direct Gemini)
    let searchContext = "";
    let useGrounding = false;

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
      }
    }

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

    try {
      const result = await geminiFlash.generateContent(prompt);
      const answer = result.response.text().trim();
      return NextResponse.json({ answer });
    } catch (geminiError) {
      console.error("Gemini API generation error, falling back to local heuristic:", geminiError);
      
      // Heuristic fallback if Gemini fails
      if (questionKey) {
        const fallbackAnswer = getFallbackAnswer(safeArea, questionKey);
        return NextResponse.json({ answer: fallbackAnswer });
      }
      
      return NextResponse.json({ 
        answer: `I could not reach Thikana AI right now, but generally, ${safeArea} is a popular neighborhood in Dhaka with various local markets, transport links, and standard residential safety features.` 
      });
    }
  } catch (error) {
    console.error("neighborhood-qa error:", error);
    return NextResponse.json({ error: "Failed to get answer" }, { status: 500 });
  }
}
