import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import OpenAI from "openai";
import { db } from "../db";
import { chatSessions, chatMessages, hotels, itineraryItems, serviceRequests, serviceTypes } from "../db/schema";
import { eq } from "drizzle-orm";

// Tool definitions for OpenAI function calling
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "create_service_request",
      description: "Create a service request for the guest. Use this when the guest wants to request any hotel service like room service, housekeeping, taxi, maintenance, late checkout, extra towels, etc.",
      parameters: {
        type: "object",
        properties: {
          requestType: {
            type: "string",
            description: "Type of service being requested (e.g., 'Room Service', 'Housekeeping', 'Taxi', 'Late Checkout', 'Extra Towels', 'Maintenance')"
          },
          details: {
            type: "string",
            description: "Additional details about the request provided by the guest"
          }
        },
        required: ["requestType"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_to_itinerary",
      description: "Add an activity or place to the guest's travel itinerary. Use when the guest wants to plan or save an activity.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Name of the activity or place" },
          description: { type: "string", description: "Description of the activity" },
          location: { type: "string", description: "Location or address" },
          category: {
            type: "string",
            enum: ["restaurant", "attraction", "beach", "nightlife", "shopping", "tour", "other"],
            description: "Category of the activity"
          },
          startTime: { type: "string", description: "Start time in ISO format (optional)" },
          endTime: { type: "string", description: "End time in ISO format (optional)" }
        },
        required: ["title"]
      }
    }
  }
];

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

    // Get available services for this hotel
    const availableServices = await db.query.serviceTypes.findMany({
      where: eq(serviceTypes.hotelId, hotelId),
      orderBy: (serviceTypes, { asc }) => [asc(serviceTypes.sortOrder)],
    });

    // Filter only active services
    const activeServices = availableServices.filter(s => s.isActive);

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

    // Build system prompt with available services
    const systemPrompt = buildSystemPrompt(hotel, guestLanguage, roomNumber, activeServices);

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
        tools,
        tool_choice: "auto",
        stream: true,
        max_tokens: 1000,
      });

      let fullResponse = "";
      let toolCallsAccumulator: { id: string; name: string; arguments: string }[] = [];

      for await (const chunk of response) {
        const choice = chunk.choices[0];
        const content = choice?.delta?.content || "";
        const finishReason = choice?.finish_reason;
        const toolCallsDelta = choice?.delta?.tool_calls;

        // Accumulate tool calls if present
        if (toolCallsDelta) {
          for (const tc of toolCallsDelta) {
            if (tc.index !== undefined) {
              if (!toolCallsAccumulator[tc.index]) {
                toolCallsAccumulator[tc.index] = { id: tc.id || "", name: "", arguments: "" };
              }
              if (tc.function?.name) {
                toolCallsAccumulator[tc.index].name = tc.function.name;
              }
              if (tc.function?.arguments) {
                toolCallsAccumulator[tc.index].arguments += tc.function.arguments;
              }
            }
          }
        }

        // Send in OpenAI-compatible format for frontend parsing
        await stream.writeSSE({
          data: JSON.stringify({
            choices: [
              {
                delta: {
                  content,
                  tool_calls: toolCallsDelta,
                },
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

// Execute tool call (called by frontend when AI requests a tool)
chatRoutes.post("/execute-tool", async (c) => {
  const { toolName, arguments: args, sessionId, hotelId, roomId, guestLanguage } = await c.req.json();

  try {
    if (toolName === "create_service_request") {
      // Create service request in database
      const [request] = await db.insert(serviceRequests).values({
        hotelId,
        roomId: roomId || null,
        requestType: args.requestType,
        details: args.details || null,
        guestLanguage: guestLanguage || "en",
        status: "pending",
      }).returning();

      // Generate success message based on language
      const messages: Record<string, string> = {
        pt: `Solicitação de ${args.requestType} criada com sucesso! Nossa equipe foi notificada.`,
        es: `¡Solicitud de ${args.requestType} creada con éxito! Nuestro equipo ha sido notificado.`,
        en: `${args.requestType} request created successfully! Our team has been notified.`,
      };

      return c.json({
        success: true,
        message: messages[guestLanguage] || messages.en,
        requestId: request.id
      });
    }

    if (toolName === "add_to_itinerary") {
      // Create itinerary item
      const [item] = await db.insert(itineraryItems).values({
        sessionId,
        hotelId,
        title: args.title,
        description: args.description || null,
        location: args.location || null,
        category: args.category || "other",
        startTime: args.startTime ? new Date(args.startTime) : null,
        endTime: args.endTime ? new Date(args.endTime) : null,
      }).returning();

      // Generate success message based on language
      const messages: Record<string, string> = {
        pt: `"${args.title}" adicionado ao seu itinerário!`,
        es: `"${args.title}" añadido a tu itinerario!`,
        en: `"${args.title}" added to your itinerary!`,
      };

      return c.json({
        success: true,
        message: messages[guestLanguage] || messages.en,
        itemId: item.id
      });
    }

    return c.json({ success: false, message: "Unknown tool" }, 400);
  } catch (error) {
    console.error("Error executing tool:", error);
    return c.json({ success: false, message: "Failed to execute action" }, 500);
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
  roomNumber?: string,
  availableServices: typeof serviceTypes.$inferSelect[] = []
): string {
  // Detailed personality descriptions for each tone
  const toneDescriptions: Record<string, { personality: string; style: string; examples: string }> = {
    relaxed_resort: {
      personality: "You are a friendly, warm, and laid-back beach resort concierge. Think tropical vibes, flip-flops, and sunset cocktails.",
      style: "Use casual, warm language. Feel free to use light humor. Be enthusiastic about outdoor activities, beach recommendations, and relaxation. Use expressions like 'No worries!', 'Enjoy!', 'Have a great time!'",
      examples: "Instead of 'Certainly, sir' say 'Sure thing! 🌴'. Instead of 'The restaurant opens at 7' say 'Breakfast starts at 7 - perfect time to catch the sunrise! ☀️'"
    },
    formal_business: {
      personality: "You are a polished, efficient, and highly professional business hotel concierge. Think executive lounges, pressed suits, and attention to detail.",
      style: "Use formal, precise language. Be concise and efficient. Focus on time, convenience, and professionalism. Address guests with respect. Avoid emojis and casual expressions.",
      examples: "Use 'Certainly', 'Of course', 'I shall arrange that immediately'. Be direct: 'Your request has been submitted. Expected response time: 15 minutes.'"
    },
    boutique_chic: {
      personality: "You are a stylish, sophisticated, and personalized boutique hotel concierge. Think curated experiences, local artisan recommendations, and Instagram-worthy spots.",
      style: "Use elegant but approachable language. Focus on unique experiences, local hidden gems, and personalized touches. Show genuine interest in making their stay special and memorable.",
      examples: "Recommend 'a charming little café the locals love' rather than 'a nearby restaurant'. Mention 'curated experiences' and 'exclusive recommendations'."
    },
    family_friendly: {
      personality: "You are a warm, patient, and helpful family resort concierge. Think kids' activities, family adventures, and making parents' lives easier.",
      style: "Use friendly, reassuring language. Be patient and understanding. Proactively mention family-friendly options, kids' amenities, and activities for all ages. Be helpful about practical family needs.",
      examples: "Mention 'The kids will love...' or 'Great for the whole family!'. Proactively offer: 'Would you like me to check if we have a high chair available?' or 'Our pool has a shallow area perfect for little ones!'"
    }
  };

  const selectedTone = toneDescriptions[hotel.toneOfVoice || "relaxed_resort"];
  const toneInstructions = `
PERSONALITY & COMMUNICATION STYLE:
${selectedTone.personality}

Style guidelines: ${selectedTone.style}

Examples: ${selectedTone.examples}

IMPORTANT: Maintain this personality consistently throughout the conversation. Your tone should reflect the hotel's brand.`;
  const langInstruction =
    language === "pt"
      ? "Responda sempre em Português do Brasil."
      : language === "es"
        ? "Responda siempre en Español."
        : "Respond in English.";

  const roomContext = roomNumber ? `\nThe guest is in room ${roomNumber}.` : "";

  // Build list of available services
  const servicesList = availableServices.map(s => {
    const name = language === "pt" && s.namePt ? s.namePt : s.name;
    return `- ${name}`;
  }).join("\n");

  const noServicesMessage = language === "pt"
    ? "Nenhum serviço configurado. Entre em contato com a recepção."
    : language === "es"
      ? "Ningún servicio configurado. Contacte la recepción."
      : "No services configured. Please contact the front desk.";

  const servicesSection = availableServices.length > 0
    ? `AVAILABLE SERVICES (ONLY create requests for these):
${servicesList}`
    : noServicesMessage;

  return `You are the AI concierge for ${hotel.name}, a hotel located in ${hotel.city}, ${hotel.country}.
${roomContext}

${toneInstructions}

HOTEL INFORMATION:
- WiFi Password: ${hotel.wifiPassword || "Ask front desk"}
- Breakfast Hours: ${hotel.breakfastHours || "7:00 AM - 10:00 AM"}
- Checkout Time: ${hotel.checkoutTime || "12:00 PM"}
- WhatsApp Contact: ${hotel.whatsappNumber || "Contact front desk"}

LANGUAGE: ${langInstruction}

${servicesSection}

CRITICAL INSTRUCTIONS FOR SERVICE REQUESTS:
1. You have a tool called "create_service_request" to create service requests for guests.
2. You can ONLY create requests for services listed above in "AVAILABLE SERVICES".
3. When a guest requests a service that IS in the list, use the create_service_request tool IMMEDIATELY.
4. When a guest requests something NOT in the list, politely explain that this specific service is not available and suggest alternatives from the list or recommend contacting the front desk/reception.
5. Use the EXACT service name from the list as the requestType parameter.

You also have "add_to_itinerary" tool to help guests plan their trip by saving activities and places to their itinerary.

FINAL REMINDERS:
- Always maintain your personality/tone as defined above
- Only offer services the hotel actually provides
- Be helpful but stay within your role as this hotel's concierge`;
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
