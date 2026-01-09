import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface ServiceType {
  id: string;
  hotel_id: string;
  name: string;
  name_pt: string | null;
  description: string | null;
  icon: string;
  whatsapp_template: string;
  whatsapp_template_pt: string | null;
  requires_details: boolean | null;
  details_placeholder: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

export function useServiceTypes(hotelId: string | null) {
  return useQuery({
    queryKey: ["service-types", hotelId],
    queryFn: async () => {
      if (!hotelId) return [];

      const data = await api.get<ServiceType[]>(`/api/services/types?hotelId=${hotelId}`);
      return data;
    },
    enabled: !!hotelId,
  });
}

export function generateWhatsAppLink(
  phoneNumber: string,
  template: string,
  roomNumber: string,
  details?: string
): string {
  let message = template.replace("[ROOM]", roomNumber);
  if (details) {
    message = message.replace("[DETAILS]", details);
  }

  // Clean phone number (remove non-digits)
  const cleanPhone = phoneNumber.replace(/\D/g, "");

  // URL encode the message
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
