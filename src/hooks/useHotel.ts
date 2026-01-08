import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
  wifi_password: string | null;
  breakfast_hours: string | null;
  checkout_time: string | null;
  whatsapp_number: string;
  accent_color: string | null;
  tone_of_voice: "relaxed_resort" | "formal_business" | "boutique_chic" | "family_friendly";
  logo_url: string | null;
  banner_url: string | null;
  language: string | null;
  timezone: string | null;
}

export interface Room {
  id: string;
  hotel_id: string;
  room_number: string;
  qr_code: string;
  floor: number | null;
  room_type: string | null;
}

export function useHotelByQR(qrCode: string | null) {
  return useQuery({
    queryKey: ["room", qrCode],
    queryFn: async () => {
      if (!qrCode) return null;
      
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("*, hotels(*)")
        .eq("qr_code", qrCode)
        .maybeSingle();

      if (roomError) throw roomError;
      if (!room) return null;

      return {
        room: room as Room,
        hotel: room.hotels as Hotel,
      };
    },
    enabled: !!qrCode,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}

export function useHotelById(hotelId: string | null) {
  return useQuery({
    queryKey: ["hotel", hotelId],
    queryFn: async () => {
      if (!hotelId) return null;
      
      const { data, error } = await supabase
        .from("hotels")
        .select("*")
        .eq("id", hotelId)
        .maybeSingle();

      if (error) throw error;
      return data as Hotel | null;
    },
    enabled: !!hotelId,
  });
}

// Demo hotel for development
export const DEMO_HOTEL_ID = "11111111-1111-1111-1111-111111111111";
export const DEMO_QR_CODE = "pelo-101";
