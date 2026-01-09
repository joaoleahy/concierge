import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
  wifi_password: string | null;
  breakfast_hours: string | null;
  checkout_time: string | null;
  whatsapp_number: string;
  tone_of_voice: "relaxed_resort" | "formal_business" | "boutique_chic" | "family_friendly";
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

      const data = await api.get<{ room: Room; hotel: Hotel }>(`/api/admin/rooms/qr/${qrCode}`);
      return data;
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

      const data = await api.get<Hotel>(`/api/admin/hotels/${hotelId}`);
      return data;
    },
    enabled: !!hotelId,
  });
}

// Demo hotel for development
export const DEMO_HOTEL_ID = "11111111-1111-1111-1111-111111111111";
export const DEMO_QR_CODE = "pelo-101";
