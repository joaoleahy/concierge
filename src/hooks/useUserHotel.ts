import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserHotelRole {
  hotel_id: string;
  role: "admin" | "staff";
  hotel: {
    id: string;
    name: string;
    city: string;
    country: string;
  };
}

/**
 * Hook to get the hotel(s) associated with the currently logged in user.
 * Returns the first hotel the user has access to (for MVP, users have 1 hotel).
 */
export function useUserHotel() {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-hotel", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          hotel_id,
          role,
          hotels:hotel_id (
            id,
            name,
            city,
            country
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      // Return the first hotel (for MVP)
      const firstRole = data[0] as any;
      return {
        hotelId: firstRole.hotel_id,
        role: firstRole.role as "admin" | "staff",
        hotel: firstRole.hotels,
        allRoles: data.map((r: any) => ({
          hotel_id: r.hotel_id,
          role: r.role,
          hotel: r.hotels,
        })) as UserHotelRole[],
      };
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return {
    hotelId: data?.hotelId ?? null,
    hotel: data?.hotel ?? null,
    role: data?.role ?? null,
    allRoles: data?.allRoles ?? [],
    isAdmin: data?.role === "admin",
    isStaff: data?.role === "staff" || data?.role === "admin",
    loading: authLoading || isLoading,
    error,
    user,
  };
}
