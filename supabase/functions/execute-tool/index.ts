import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation helpers
const isValidUUID = (str: string): boolean => 
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const isValidDate = (str: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(str);

const isValidTime = (str: string): boolean =>
  /^\d{2}:\d{2}$/.test(str);

const sanitizeString = (str: unknown, maxLength: number): string => {
  if (typeof str !== 'string') return '';
  return str.slice(0, maxLength).replace(/[<>]/g, '');
};

const ALLOWED_REQUEST_TYPES = [
  'room_service', 'housekeeping', 'late_checkout', 'early_checkin',
  'taxi', 'extra_towels', 'extra_pillows', 'maintenance', 'laundry',
  'wake_up_call', 'concierge', 'luggage', 'spa', 'restaurant', 'other'
];

const ALLOWED_CATEGORIES = [
  'restaurant', 'attraction', 'beach', 'nightlife', 'shopping', 'tour', 'other'
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { toolName, arguments: args, sessionId, hotelId, roomId } = body;

    // Input validation
    if (!sessionId || typeof sessionId !== 'string' || !isValidUUID(sessionId)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid session ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!hotelId || typeof hotelId !== 'string' || !isValidUUID(hotelId)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid hotel ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (roomId && (typeof roomId !== 'string' || !isValidUUID(roomId))) {
      return new Response(JSON.stringify({ success: false, message: "Invalid room ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!toolName || typeof toolName !== 'string') {
      return new Response(JSON.stringify({ success: false, message: "Invalid tool name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate session exists and belongs to the hotel
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id, hotel_id, room_id")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ success: false, message: "Invalid session" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.hotel_id !== hotelId) {
      return new Response(JSON.stringify({ success: false, message: "Session does not belong to this hotel" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: { success: boolean; message: string; data?: unknown };

    // Friendly names for request types
    const friendlyNames: Record<string, string> = {
      room_service: "Room Service",
      housekeeping: "Housekeeping",
      late_checkout: "Late Checkout",
      early_checkin: "Early Check-in",
      taxi: "Taxi",
      extra_towels: "Extra Towels",
      extra_pillows: "Extra Pillows",
      maintenance: "Maintenance",
      laundry: "Laundry",
      wake_up_call: "Wake-up Call",
    };

    switch (toolName) {
      case "create_service_request": {
        if (!args || typeof args !== 'object') {
          result = { success: false, message: "Invalid arguments" };
          break;
        }

        const request_type = sanitizeString(args.request_type, 50);
        const details = sanitizeString(args.details, 500);

        if (!request_type) {
          result = { success: false, message: "Request type is required" };
          break;
        }

        // Normalize request_type
        const normalizedType = request_type.toLowerCase().replace(/[\s-]/g, '_');
        
        // Allow known types or 'other' for custom requests
        const finalType = ALLOWED_REQUEST_TYPES.includes(normalizedType) ? normalizedType : 'other';

        const { data, error } = await supabase
          .from("service_requests")
          .insert({
            hotel_id: hotelId,
            room_id: roomId || session.room_id,
            request_type: finalType,
            details: details || (finalType === 'other' ? request_type : null),
            status: "pending",
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating service request:", error);
          result = { success: false, message: "Failed to create service request" };
        } else {
          const friendlyName = friendlyNames[finalType] || request_type.replace(/_/g, " ");
          result = { 
            success: true, 
            message: `✅ Done! Your ${friendlyName.toLowerCase()} request has been received. Our staff will attend to it shortly.`,
            data 
          };
        }
        break;
      }

      case "create_itinerary_item": {
        if (!args || typeof args !== 'object') {
          result = { success: false, message: "Invalid arguments" };
          break;
        }

        const title = sanitizeString(args.title, 100);
        const description = sanitizeString(args.description, 500);
        const location = sanitizeString(args.location, 200);
        const category = sanitizeString(args.category, 50);
        const date = sanitizeString(args.date, 10);
        const start_time = sanitizeString(args.start_time, 5);
        const end_time = sanitizeString(args.end_time, 5);

        if (!title || !date || !start_time) {
          result = { success: false, message: "Title, date, and start time are required" };
          break;
        }

        if (!isValidDate(date)) {
          result = { success: false, message: "Invalid date format. Use YYYY-MM-DD" };
          break;
        }

        if (!isValidTime(start_time)) {
          result = { success: false, message: "Invalid start time format. Use HH:MM" };
          break;
        }

        if (end_time && !isValidTime(end_time)) {
          result = { success: false, message: "Invalid end time format. Use HH:MM" };
          break;
        }

        // Validate category
        const normalizedCategory = category?.toLowerCase() || 'other';
        const finalCategory = ALLOWED_CATEGORIES.includes(normalizedCategory) ? normalizedCategory : 'other';

        // Parse date and time
        const startDateTime = new Date(`${date}T${start_time}:00`);
        const endDateTime = end_time ? new Date(`${date}T${end_time}:00`) : null;

        if (isNaN(startDateTime.getTime())) {
          result = { success: false, message: "Invalid date/time combination" };
          break;
        }

        const { data, error } = await supabase
          .from("itinerary_items")
          .insert({
            session_id: sessionId,
            hotel_id: hotelId,
            title,
            description: description || null,
            location: location || null,
            category: finalCategory,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime?.toISOString() || null,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating itinerary item:", error);
          result = { success: false, message: "Failed to add to itinerary" };
        } else {
          result = { 
            success: true, 
            message: `"${title}" has been added to your itinerary for ${date} at ${start_time}.`,
            data 
          };
        }
        break;
      }

      default:
        result = { success: false, message: "Unknown tool" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Execute tool error:", e);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "An error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});