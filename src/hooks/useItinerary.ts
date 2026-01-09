import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface ItineraryItem {
  id: string;
  session_id: string;
  hotel_id: string;
  title: string;
  description: string | null;
  location: string | null;
  category: string;
  start_time: string;
  end_time: string | null;
  google_maps_url: string | null;
  recommendation_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useItinerary(sessionId: string | null) {
  return useQuery({
    queryKey: ["itinerary", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const data = await api.get<ItineraryItem[]>(`/api/chat/itinerary?sessionId=${sessionId}`);
      return data;
    },
    enabled: !!sessionId,
  });
}

export function useCreateItineraryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<ItineraryItem, "id" | "created_at" | "updated_at">) => {
      const data = await api.post<ItineraryItem>("/api/chat/itinerary", item);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", variables.session_id] });
    },
  });
}

export function useUpdateItineraryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      sessionId,
      ...updates
    }: { id: string; sessionId: string } & Partial<ItineraryItem>) => {
      const data = await api.patch<ItineraryItem>(`/api/chat/itinerary/${id}`, updates);
      return data;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["itinerary", variables.sessionId] });

      const previousItems = queryClient.getQueryData<ItineraryItem[]>([
        "itinerary",
        variables.sessionId,
      ]);

      if (previousItems) {
        queryClient.setQueryData<ItineraryItem[]>(
          ["itinerary", variables.sessionId],
          previousItems.map((item) => (item.id === variables.id ? { ...item, ...variables } : item))
        );
      }

      return { previousItems };
    },
    onError: (_, variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["itinerary", variables.sessionId], context.previousItems);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", variables.sessionId] });
    },
  });
}

export function useDeleteItineraryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sessionId }: { id: string; sessionId: string }) => {
      await api.delete(`/api/chat/itinerary/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", variables.sessionId] });
    },
  });
}
