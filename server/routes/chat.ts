import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import OpenAI from "openai";
import { db } from "../db";
import { chatSessions, chatMessages, hotels, itineraryItems } from "../db/schema";
import { eq } from "drizzle-orm";

export const chatRoutes = new Hono();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Message schema
const messageSchema = z.object({
  sessionId: z.string().uuid(),
  hotelId: z.string().uuid(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  roomNumber: z.string().optional(),
  guestLanguage: z.string().default("en"),
});

// Send a message and get AI response (streaming)
chatRoutes.post("/message", zValidator("json", messageSchema), async (c) => {
  const { sessionId, hotelId, messages: incomingMessages, roomNumber, guestLanguage } = c.req.valid("json");

  try {
    // Get hotel info for context
    const hotel = await db.query.hotels.findFirst({
      where: eq(hotels.id, hotelId),
    });

    if (!hotel) {
      return c.json({ error: "Hotel not found" }, 404);
    }

    // Get the latest user message
    const lastUserMessage = incomingMessages.filter((m) => m.role === "user").pop();
    if (lastUserMessage) {
      // Save user message
      await db.insert(chatMessages).values({
        sessionId,
        role: "user",
        content: lastUserMessage.content,
      });
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(hotel, guestLanguage, roomNumber);

    // Create OpenAI messages
    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...incomingMessages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    // Stream response using SSE format expected by frontend
    return streamSSE(c, async (stream) => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: openaiMessages,
        stream: true,
        max_tokens: 1000,
      });

      let fullResponse = "";

      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || "";
        const finishReason = chunk.choices[0]?.finish_reason;

        // Send in OpenAI-compatible format for frontend parsing
        await stream.writeSSE({
          data: JSON.stringify({
            choices: [
              {
                delta: { content },
                finish_reason: finishReason,
              },
            ],
          }),
        });

        if (content) {
          fullResponse += content;
        }
      }

      // Save assistant message
      if (fullResponse) {
        await db.insert(chatMessages).values({
          sessionId,
          role: "assistant",
          content: fullResponse,
        });
      }

      await stream.writeSSE({ data: "[DONE]" });
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
function buildSystemPrompt(
  hotel: typeof hotels.$inferSelect,
  language: string,
  roomNumber?: string
): string {
  const toneDescriptions: Record<string, string> = {
    relaxed_resort: "friendly, warm, and casual like a beach resort concierge",
    formal_business: "professional, efficient, and courteous like a luxury business hotel",
    boutique_chic: "stylish, personalized, and attentive like a boutique hotel",
    family_friendly: "warm, helpful, and accommodating like a family resort",
  };

  const tone = toneDescriptions[hotel.toneOfVoice || "relaxed_resort"];
  const langInstruction =
    language === "pt"
      ? "Responda sempre em Português do Brasil."
      : language === "es"
        ? "Responda siempre en Español."
        : "Respond in English.";

  const roomContext = roomNumber ? `\nThe guest is in room ${roomNumber}.` : "";

  return `You are the AI concierge for ${hotel.name}, a hotel in ${hotel.city}, ${hotel.country}.

Your personality: ${tone}
${roomContext}

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

// ============================================================================
// ITINERARY
// ============================================================================

// Get itinerary items for a session
chatRoutes.get("/itinerary", async (c) => {
  const sessionId = c.req.query("sessionId");

  if (!sessionId) {
    return c.json({ error: "sessionId is required" }, 400);
  }

  try {
    const items = await db.query.itineraryItems.findMany({
      where: eq(itineraryItems.sessionId, sessionId),
      orderBy: (itineraryItems, { asc }) => [asc(itineraryItems.startTime)],
    });

    // Transform to snake_case for frontend compatibility
    return c.json(
      items.map((item) => ({
        id: item.id,
        session_id: item.sessionId,
        hotel_id: item.hotelId,
        title: item.title,
        description: item.description,
        location: item.location,
        category: item.category,
        start_time: item.startTime,
        end_time: item.endTime,
        google_maps_url: item.googleMapsUrl,
        recommendation_id: item.recommendationId,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching itinerary:", error);
    return c.json({ error: "Failed to fetch itinerary" }, 500);
  }
});

// Create itinerary item
chatRoutes.post("/itinerary", async (c) => {
  const data = await c.req.json();

  try {
    const [item] = await db
      .insert(itineraryItems)
      .values({
        sessionId: data.session_id,
        hotelId: data.hotel_id,
        title: data.title,
        description: data.description,
        location: data.location,
        category: data.category,
        startTime: data.start_time ? new Date(data.start_time) : null,
        endTime: data.end_time ? new Date(data.end_time) : null,
        googleMapsUrl: data.google_maps_url,
        recommendationId: data.recommendation_id,
      })
      .returning();

    return c.json(
      {
        id: item.id,
        session_id: item.sessionId,
        hotel_id: item.hotelId,
        title: item.title,
        description: item.description,
        location: item.location,
        category: item.category,
        start_time: item.startTime,
        end_time: item.endTime,
        google_maps_url: item.googleMapsUrl,
        recommendation_id: item.recommendationId,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      },
      201
    );
  } catch (error) {
    console.error("Error creating itinerary item:", error);
    return c.json({ error: "Failed to create itinerary item" }, 500);
  }
});

// Update itinerary item
chatRoutes.patch("/itinerary/:id", async (c) => {
  const id = c.req.param("id");
  const data = await c.req.json();

  try {
    const updates: Record<string, any> = { updatedAt: new Date() };

    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.location !== undefined) updates.location = data.location;
    if (data.category !== undefined) updates.category = data.category;
    if (data.start_time !== undefined) updates.startTime = data.start_time ? new Date(data.start_time) : null;
    if (data.end_time !== undefined) updates.endTime = data.end_time ? new Date(data.end_time) : null;
    if (data.google_maps_url !== undefined) updates.googleMapsUrl = data.google_maps_url;
    if (data.recommendation_id !== undefined) updates.recommendationId = data.recommendation_id;

    const [item] = await db
      .update(itineraryItems)
      .set(updates)
      .where(eq(itineraryItems.id, id))
      .returning();

    if (!item) {
      return c.json({ error: "Itinerary item not found" }, 404);
    }

    return c.json({
      id: item.id,
      session_id: item.sessionId,
      hotel_id: item.hotelId,
      title: item.title,
      description: item.description,
      location: item.location,
      category: item.category,
      start_time: item.startTime,
      end_time: item.endTime,
      google_maps_url: item.googleMapsUrl,
      recommendation_id: item.recommendationId,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    });
  } catch (error) {
    console.error("Error updating itinerary item:", error);
    return c.json({ error: "Failed to update itinerary item" }, 500);
  }
});

// Delete itinerary item
chatRoutes.delete("/itinerary/:id", async (c) => {
  const id = c.req.param("id");

  try {
    await db.delete(itineraryItems).where(eq(itineraryItems.id, id));
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting itinerary item:", error);
    return c.json({ error: "Failed to delete itinerary item" }, 500);
  }
});
