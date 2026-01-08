import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ServiceRequest {
  id: string;
  hotel_id: string;
  room_id: string | null;
  service_type_id: string | null;
  request_type: string;
  details: string | null;
  status: string;
  guest_language: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  staff_response: string | null;
  responded_at: string | null;
}

// Play notification sound using Web Audio API
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a pleasant two-tone notification
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + startTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + startTime + duration);
      
      oscillator.start(audioContext.currentTime + startTime);
      oscillator.stop(audioContext.currentTime + startTime + duration);
    };
    
    // Play two ascending tones
    playTone(880, 0, 0.15);    // A5
    playTone(1100, 0.12, 0.15); // C#6
  } catch (error) {
    console.warn("Could not play notification sound:", error);
  }
};

export function useServiceRequests(hotelId: string | null) {
  return useQuery({
    queryKey: ["service-requests", hotelId],
    queryFn: async () => {
      if (!hotelId) return [];
      
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ServiceRequest[];
    },
    enabled: !!hotelId,
  });
}

export function useRealtimeServiceRequests(hotelId: string | null, soundEnabled: boolean = true) {
  const queryClient = useQueryClient();
  const [newRequestCount, setNewRequestCount] = useState(0);

  const playSoundIfEnabled = useCallback(() => {
    if (soundEnabled) {
      playNotificationSound();
    }
  }, [soundEnabled]);
  useEffect(() => {
    if (!hotelId) return;

    const channel = supabase
      .channel(`service-requests-${hotelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "service_requests",
          filter: `hotel_id=eq.${hotelId}`,
        },
        (payload) => {
          // Invalidate query to refetch
          queryClient.invalidateQueries({ queryKey: ["service-requests", hotelId] });
          
          // Play notification sound if enabled
          playSoundIfEnabled();
          
          // Show toast notification
          const request = payload.new as ServiceRequest;
          toast.info(`Nova solicitação: ${request.request_type}`, {
            description: request.details || "Sem detalhes adicionais",
          });
          
          // Increment counter
          setNewRequestCount((prev) => prev + 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "service_requests",
          filter: `hotel_id=eq.${hotelId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["service-requests", hotelId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hotelId, queryClient, playSoundIfEnabled]);

  const resetNewRequestCount = () => setNewRequestCount(0);

  return { newRequestCount, resetNewRequestCount };
}

export function useUpdateServiceRequest() {
  const queryClient = useQueryClient();

  const updateStatus = async (id: string, hotelId: string, status: string, staffResponse?: string) => {
    const updates: Record<string, unknown> = { status };
    
    if (status === "completed") {
      updates.completed_at = new Date().toISOString();
      updates.resolution = "fulfilled";
    }

    if (status === "declined") {
      updates.resolution = "declined_by_staff";
    }

    if (staffResponse) {
      updates.staff_response = staffResponse;
      updates.responded_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("service_requests")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
    
    queryClient.invalidateQueries({ queryKey: ["service-requests", hotelId] });
  };

  return { updateStatus };
}
