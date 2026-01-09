import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import OpenAI from "openai";
import { db } from "../db";
import { chatSessions, chatMessages, hotels } from "../db/schema";
import { eq } from "drizzle-orm";

export const chatRoutes = new Hono();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Message schema
const messageSchema = z.object({
  sessionId: z.string().uuid(),
  hotelId: z.string().uuid(),
  message: z.string(),
  language: z.string().default("en"),
});

// Send a message and get AI response (streaming)
chatRoutes.post("/message", zValidator("json", messageSchema), async (c) => {
  const { sessionId, hotelId, message, language } = c.req.valid("json");

  try {
    // Get hotel info for context
    const hotel = await db.query.hotels.findFirst({
      where: eq(hotels.id, hotelId),
    });

    if (!hotel) {
      return c.json({ error: "Hotel not found" }, 404);
    }

    // Save user message
    await db.insert(chatMessages).values({
      sessionId,
      role: "user",
      content: message,
    });

    // Get conversation history
    const history = await db.query.chatMessages.findMany({
      where: eq(chatMessages.sessionId, sessionId),
      orderBy: (chatMessages, { asc }) => [asc(chatMessages.createdAt)],
      limit: 20,
    });

    // Build system prompt
    const systemPrompt = buildSystemPrompt(hotel, language);

    // Create OpenAI messages
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    // Stream response
    return streamSSE(c, async (stream) => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        stream: true,
        max_tokens: 1000,
      });

      let fullResponse = "";

      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          await stream.writeSSE({
            data: JSON.stringify({ content, done: false }),
          });
        }
      }

      // Save assistant message
      await db.insert(chatMessages).values({
        sessionId,
        role: "assistant",
        content: fullResponse,
      });

      await stream.writeSSE({
        data: JSON.stringify({ content: "", done: true }),
      });
    });
  } catch (error) {
    console.error("Error in chat:", error);
    return c.json({ error: "Failed to process message" }, 500);
  }
});

// Create a new chat session
chatRoutes.post("/session", async (c) => {
  const { hotelId, roomId, guestLanguage } = await c.req.json();

  try {
    const [session] = await db
      .insert(chatSessions)
      .values({
        hotelId,
        roomId,
        guestLanguage: guestLanguage || "en",
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      })
      .returning();

    return c.json(session, 201);
  } catch (error) {
    console.error("Error creating session:", error);
    return c.json({ error: "Failed to create session" }, 500);
  }
});

// Get chat history for a session
chatRoutes.get("/history/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");

  try {
    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.sessionId, sessionId),
      orderBy: (chatMessages, { asc }) => [asc(chatMessages.createdAt)],
    });

    return c.json(messages);
  } catch (error) {
    console.error("Error fetching history:", error);
    return c.json({ error: "Failed to fetch history" }, 500);
  }
});

// Helper function to build system prompt
function buildSystemPrompt(hotel: typeof hotels.$inferSelect, language: string): string {
  const toneDescriptions: Record<string, string> = {
    relaxed_resort: "friendly, warm, and casual like a beach resort concierge",
    formal_business: "professional, efficient, and courteous like a luxury business hotel",
    boutique_chic: "stylish, personalized, and attentive like a boutique hotel",
    family_friendly: "warm, helpful, and accommodating like a family resort",
  };

  const tone = toneDescriptions[hotel.toneOfVoice || "relaxed_resort"];
  const langInstruction = language === "pt"
    ? "Responda sempre em Português do Brasil."
    : language === "es"
    ? "Responda siempre en Español."
    : "Respond in English.";

  return `You are the AI concierge for ${hotel.name}, a hotel in ${hotel.city}, ${hotel.country}.

Your personality: ${tone}

Hotel Information:
- WiFi Password: ${hotel.wifiPassword || "Ask front desk"}
- Breakfast Hours: ${hotel.breakfastHours || "7:00 AM - 10:00 AM"}
- Checkout Time: ${hotel.checkoutTime || "12:00 PM"}
- Contact: ${hotel.whatsappNumber}

${langInstruction}

You can help guests with:
- Hotel services and amenities
- Local recommendations
- Room service orders
- Travel planning
- General questions about the area

Be helpful, concise, and maintain the hotel's service standards.`;
}
