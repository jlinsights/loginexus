import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
// Note: process.env.API_KEY is injected by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are LogiNexus AI, a world-class logistics and supply chain expert assistant for a digital freight forwarding platform.
Your goal is to assist users with:
1. Understanding complex shipping terms (Incoterms, HS Codes).
2. Providing market intelligence (freight rate trends, port congestion).
3. Optimizing routes and suggesting cost-saving measures.
4. Analyzing supply chain risks.

Keep your answers professional, concise, and data-driven. 
If asked about specific real-time tracking data (like "Where is container ABCD123?"), explain that you are an AI assistant and they should check the Tracking module, but you can explain general tracking statuses.

When providing market insights, pretend you have access to the latest indices (SCFI, FBX) and give realistic, plausible trends for the current year.
`;

export const sendMessageToGemini = async (
  message: string,
  history: { role: 'user' | 'model'; text: string }[] = []
): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // Using googleSearch to provide grounded market info if relevant
        tools: [{ googleSearch: {} }] 
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm currently experiencing high traffic. Please try again later.";
  }
};

export const generateMarketBrief = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate a concise 3-bullet point executive summary of the current global ocean freight market situation involving Asia to North America and Europe routes. Focus on rates and congestion.",
      config: {
        systemInstruction: "You are a logistics market analyst.",
        thinkingConfig: { thinkingBudget: 0 } // Fast response needed
      }
    });
    return response.text || "Market data unavailable.";
  } catch (error) {
    console.error("Gemini Brief Error:", error);
    return "Unable to load market brief.";
  }
};
