import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      
      const { data, error } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("hotel_id", hotelId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as MenuCategory[];
    },
    enabled: !!hotelId,
  });
}

export function useMenuItems(hotelId: string | null, categoryId?: string) {
  return useQuery({
    queryKey: ["menu-items", hotelId, categoryId],
    queryFn: async () => {
      if (!hotelId) return [];
      
      let query = supabase
        .from("menu_items")
        .select("*")
        .eq("hotel_id", hotelId)
        .eq("is_available", true)
        .order("sort_order", { ascending: true });

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!hotelId,
  });
}
