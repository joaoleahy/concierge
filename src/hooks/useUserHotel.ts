import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
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

      const data = await api.get<{
        hotelId: string;
        role: "admin" | "staff";
        hotel: {
          id: string;
          name: string;
          city: string;
          country: string;
        };
        allRoles: UserHotelRole[];
      }>(`/api/custom-auth/user-hotel?userId=${user.id}`);

      return data;
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
