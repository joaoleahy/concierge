import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface GuestRequest {
  id: string;
  request_type: string;
  details: string | null;
  status: string;
  staff_response: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  service_type_id: string | null;
  resolution: string | null;
  guest_accepted: boolean | null;
}

export function useGuestRequests(roomId: string | null) {
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["guest-requests", roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const data = await api.get<GuestRequest[]>(`/api/services/requests?roomId=${roomId}`);
      return data;
    },
    enabled: !!roomId,
    refetchInterval: 10000, // Poll every 10 seconds for updates
  });

  // Use SSE for realtime updates if available
  useEffect(() => {
    if (!roomId) return;

    const API_URL = import.meta.env.VITE_API_URL || "";
    const eventSource = new EventSource(`${API_URL}/api/services/requests/stream?roomId=${roomId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "update") {
          queryClient.invalidateQueries({ queryKey: ["guest-requests", roomId] });
          if (data.hasStaffResponse) {
            setHasNewUpdate(true);
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      // SSE connection failed, will fall back to polling
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [roomId, queryClient]);

  const clearNewUpdate = useCallback(() => setHasNewUpdate(false), []);

  return { requests, isLoading, hasNewUpdate, clearNewUpdate };
}
