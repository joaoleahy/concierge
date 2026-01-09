import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface LocalRecommendation {
  id: string;
  hotel_id: string;
  name: string;
  name_pt: string | null;
  description: string | null;
  description_pt: string | null;
  category: string;
  address: string | null;
  google_maps_url: string | null;
  image_url: string | null;
  price_range: string | null;
  is_hidden_gem: boolean | null;
  sort_order: number | null;
  is_active: boolean | null;
}

export function useLocalRecommendations(hotelId: string | null, category?: string) {
  return useQuery({
    queryKey: ["local-recommendations", hotelId, category],
    queryFn: async () => {
      if (!hotelId) return [];

      let url = `/api/admin/recommendations?hotelId=${hotelId}`;
      if (category) {
        url += `&category=${category}`;
      }

      const data = await api.get<LocalRecommendation[]>(url);
      return data;
    },
    enabled: !!hotelId,
  });
}

export const RECOMMENDATION_CATEGORIES = [
  { id: "landmarks", label: "Landmarks", icon: "landmark" },
  { id: "restaurants", label: "Restaurants", icon: "utensils" },
  { id: "beaches", label: "Beaches", icon: "umbrella-beach" },
  { id: "culture", label: "Culture", icon: "palette" },
  { id: "shopping", label: "Shopping", icon: "shopping-bag" },
  { id: "nightlife", label: "Nightlife", icon: "moon" },
] as const;
