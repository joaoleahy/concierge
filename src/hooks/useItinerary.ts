import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      
      const { data, error } = await supabase
        .from("itinerary_items")
        .select("*")
        .eq("session_id", sessionId)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as ItineraryItem[];
    },
    enabled: !!sessionId,
  });
}

export function useCreateItineraryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<ItineraryItem, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("itinerary_items")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
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
      const { data, error } = await supabase
        .from("itinerary_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["itinerary", variables.sessionId] });

      // Snapshot previous value
      const previousItems = queryClient.getQueryData<ItineraryItem[]>(["itinerary", variables.sessionId]);

      // Optimistically update
      if (previousItems) {
        queryClient.setQueryData<ItineraryItem[]>(
          ["itinerary", variables.sessionId],
          previousItems.map(item =>
            item.id === variables.id
              ? { ...item, ...variables }
              : item
          )
        );
      }

      return { previousItems };
    },
    onError: (_, variables, context) => {
      // Rollback on error
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
      const { error } = await supabase
        .from("itinerary_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", variables.sessionId] });
    },
  });
}
