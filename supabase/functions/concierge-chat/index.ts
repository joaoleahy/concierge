import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface HotelContext {
  hotelName: string;
  city: string;
  country: string;
  hotelLanguage: string;
  guestLanguage: string;
  toneOfVoice: string;
  wifiPassword: string | null;
  breakfastHours: string | null;
  checkoutTime: string | null;
  roomNumber: string;
  serviceTypes: string[];
  localRecommendations: { name: string; category: string; description: string }[];
}

// Input validation helpers
const isValidUUID = (str: string): boolean => 
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const isValidLanguage = (code: string): boolean =>
  ['en', 'pt', 'es', 'de', 'fr', 'it'].includes(code);

const isValidRole = (role: string): boolean =>
  ['user', 'assistant', 'system'].includes(role);

const sanitizeString = (str: string, maxLength: number): string =>
  String(str).slice(0, maxLength).replace(/[<>]/g, '');

const validateMessages = (messages: unknown): Message[] | null => {
  if (!Array.isArray(messages)) return null;
  if (messages.length > 50) return null;
  
  const validated: Message[] = [];
  for (const msg of messages) {
    if (typeof msg !== 'object' || msg === null) return null;
    const { role, content } = msg as { role?: unknown; content?: unknown };
    if (typeof role !== 'string' || !isValidRole(role)) return null;
    if (typeof content !== 'string') return null;
    if (content.length > 5000) return null;
    validated.push({ role: role as Message['role'], content });
  }
  return validated;
};

const getToneInstructions = (tone: string): string => {
  const tones: Record<string, string> = {
    relaxed_resort: "Be warm, friendly, and casual. Use relaxed language like a beach resort concierge.",
    formal_business: "Be professional and polished. Use formal language appropriate for a business hotel.",
    boutique_chic: "Be stylish and personable. Use sophisticated but approachable language.",
    family_friendly: "Be cheerful and helpful. Use simple, warm language that works for all ages.",
  };
  return tones[tone] || tones.relaxed_resort;
};

const getLanguageName = (code: string): string => {
  const languages: Record<string, string> = {
    en: "English",
    pt: "Portuguese",
    es: "Spanish",
    de: "German",
    fr: "French",
    it: "Italian",
  };
  return languages[code] || "English";
};

const buildSystemPrompt = (ctx: HotelContext): string => {
  const toneInstructions = getToneInstructions(ctx.toneOfVoice);
  const guestLangName = getLanguageName(ctx.guestLanguage);
  
  return `You are the AI Concierge of ${ctx.hotelName} in ${ctx.city}, ${ctx.country}.
Room: ${ctx.roomNumber}

${toneInstructions}

**CRITICAL LANGUAGE INSTRUCTION**:
You MUST respond ONLY in ${guestLangName} (language code: ${ctx.guestLanguage}).
Every single response must be in ${guestLangName}. No exceptions.
Do not switch languages even if the guest writes in another language.

CAPABILITIES - You can help guests with:
1. **Service Requests**: ${ctx.serviceTypes.join(", ")}
   - When a guest requests a service, confirm the request and use the create_service_request tool
2. **Itinerary Planning**: Create and manage trip itineraries
   - When a guest wants to plan activities, use the create_itinerary_item tool
3. **Local Recommendations**: Suggest restaurants, attractions, hidden gems in ${ctx.city}
4. **Hotel Information**: WiFi, breakfast, checkout, amenities

HOTEL INFO:
- WiFi Password: ${ctx.wifiPassword || "Ask reception"}
- Breakfast: ${ctx.breakfastHours || "Check with reception"}
- Checkout: ${ctx.checkoutTime || "12:00"}

LOCAL GEMS (curated by the hotel):
${ctx.localRecommendations.map(r => `- ${r.name} (${r.category}): ${r.description}`).join("\n")}

RULES:
- Be concise and helpful
- ALWAYS respond in ${guestLangName}
- Always confirm before creating service requests
- For itineraries, suggest times based on typical tourist schedules
- Never recommend unsafe or unverified locations
- If unsure, offer to connect with hotel staff`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages, sessionId, hotelId, roomNumber, guestLanguage } = body;
    
    // Input validation
    if (!sessionId || typeof sessionId !== 'string' || !isValidUUID(sessionId)) {
      return new Response(JSON.stringify({ error: "Invalid session ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!hotelId || typeof hotelId !== 'string' || !isValidUUID(hotelId)) {
      return new Response(JSON.stringify({ error: "Invalid hotel ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validatedMessages = validateMessages(messages);
    if (!validatedMessages) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitizedRoomNumber = roomNumber ? sanitizeString(roomNumber, 20) : "Unknown";
    const validatedLanguage = guestLanguage && isValidLanguage(guestLanguage) ? guestLanguage : "en";

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate session exists and belongs to the hotel
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id, hotel_id")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.hotel_id !== hotelId) {
      return new Response(JSON.stringify({ error: "Session does not belong to this hotel" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch hotel context
    const { data: hotel } = await supabase
      .from("hotels")
      .select("*")
      .eq("id", hotelId)
      .single();

    if (!hotel) {
      return new Response(JSON.stringify({ error: "Hotel not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: serviceTypes } = await supabase
      .from("service_types")
      .select("name")
      .eq("hotel_id", hotelId)
      .eq("is_active", true);

    const { data: recommendations } = await supabase
      .from("local_recommendations")
      .select("name, category, description")
      .eq("hotel_id", hotelId)
      .eq("is_active", true)
      .limit(10);

    const context: HotelContext = {
      hotelName: hotel.name,
      city: hotel.city,
      country: hotel.country,
      hotelLanguage: hotel.language || "en",
      guestLanguage: validatedLanguage,
      toneOfVoice: hotel.tone_of_voice || "relaxed_resort",
      wifiPassword: hotel.wifi_password,
      breakfastHours: hotel.breakfast_hours,
      checkoutTime: hotel.checkout_time,
      roomNumber: sanitizedRoomNumber,
      serviceTypes: serviceTypes?.map(s => s.name) || [],
      localRecommendations: recommendations || [],
    };

    const systemPrompt = buildSystemPrompt(context);

    // Define tools for the AI
    const tools = [
      {
        type: "function",
        function: {
          name: "create_service_request",
          description: "Create a service request for the guest (housekeeping, late checkout, taxi, etc.)",
          parameters: {
            type: "object",
            properties: {
              request_type: {
                type: "string",
                description: "Type of service request (e.g., 'housekeeping', 'late_checkout', 'taxi', 'extra_towels')"
              },
              details: {
                type: "string",
                description: "Additional details about the request"
              }
            },
            required: ["request_type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_itinerary_item",
          description: "Add an item to the guest's trip itinerary",
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Name of the activity or place"
              },
              description: {
                type: "string",
                description: "Brief description of the activity"
              },
              location: {
                type: "string",
                description: "Location or address"
              },
              category: {
                type: "string",
                enum: ["restaurant", "attraction", "beach", "nightlife", "shopping", "tour", "other"],
                description: "Category of the activity"
              },
              date: {
                type: "string",
                description: "Date in YYYY-MM-DD format"
              },
              start_time: {
                type: "string",
                description: "Start time in HH:MM format (24h)"
              },
              end_time: {
                type: "string",
                description: "End time in HH:MM format (24h), optional"
              }
            },
            required: ["title", "date", "start_time"]
          }
        }
      }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...validatedMessages,
        ],
        tools,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", response.status);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return the stream
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      },
    });
  } catch (e) {
    console.error("Concierge chat error:", e);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});