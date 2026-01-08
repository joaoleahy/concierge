import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [requests, setRequests] = useState<GuestRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    // Fetch initial requests
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("id, request_type, details, status, staff_response, responded_at, created_at, updated_at, service_type_id, resolution, guest_accepted")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching guest requests:", error);
      } else {
        setRequests(data || []);
      }
      setIsLoading(false);
    };

    fetchRequests();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`guest-requests-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_requests",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRequests((prev) => [payload.new as GuestRequest, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as GuestRequest;
            setRequests((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r))
            );
            // Flag new update if staff responded
            if (updated.staff_response) {
              setHasNewUpdate(true);
            }
          } else if (payload.eventType === "DELETE") {
            setRequests((prev) =>
              prev.filter((r) => r.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const clearNewUpdate = () => setHasNewUpdate(false);

  return { requests, isLoading, hasNewUpdate, clearNewUpdate };
}
