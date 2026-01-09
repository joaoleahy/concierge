import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface MenuCategory {
  id: string;
  hotel_id: string;
  name: string;
  name_pt: string | null;
  description: string | null;
  icon: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

export interface MenuItem {
  id: string;
  category_id: string;
  hotel_id: string;
  name: string;
  name_pt: string | null;
  description: string | null;
  description_pt: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean | null;
  is_vegetarian: boolean | null;
  is_vegan: boolean | null;
  is_gluten_free: boolean | null;
  sort_order: number | null;
}

export function useMenuCategories(hotelId: string | null) {
  return useQuery({
    queryKey: ["menu-categories", hotelId],
    queryFn: async () => {
      if (!hotelId) return [];

      const data = await api.get<(MenuCategory & { items: MenuItem[] })[]>(
        `/api/menu/categories?hotelId=${hotelId}`
      );
      return data;
    },
    enabled: !!hotelId,
  });
}

export function useMenuItems(hotelId: string | null, categoryId?: string) {
  return useQuery({
    queryKey: ["menu-items", hotelId, categoryId],
    queryFn: async () => {
      if (!hotelId) return [];

      let url = `/api/menu/items?hotelId=${hotelId}`;
      if (categoryId) {
        url += `&categoryId=${categoryId}`;
      }

      const data = await api.get<MenuItem[]>(url);
      return data;
    },
    enabled: !!hotelId,
  });
}
