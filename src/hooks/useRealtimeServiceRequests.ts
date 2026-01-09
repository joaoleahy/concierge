import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
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
    playTone(880, 0, 0.15); // A5
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

      const data = await api.get<ServiceRequest[]>(`/api/services/requests?hotelId=${hotelId}`);
      return data;
    },
    enabled: !!hotelId,
    refetchInterval: 15000, // Poll every 15 seconds as fallback
  });
}

export function useRealtimeServiceRequests(hotelId: string | null, soundEnabled: boolean = true) {
  const queryClient = useQueryClient();
  const [newRequestCount, setNewRequestCount] = useState(0);
  const [lastKnownCount, setLastKnownCount] = useState(0);

  const playSoundIfEnabled = useCallback(() => {
    if (soundEnabled) {
      playNotificationSound();
    }
  }, [soundEnabled]);

  // Use SSE for realtime updates
  useEffect(() => {
    if (!hotelId) return;

    const API_URL = import.meta.env.VITE_API_URL || "";
    const eventSource = new EventSource(`${API_URL}/api/services/requests/stream?hotelId=${hotelId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "new_request") {
          queryClient.invalidateQueries({ queryKey: ["service-requests", hotelId] });
          playSoundIfEnabled();

          toast.info(`Nova solicitação: ${data.request?.request_type || "Novo pedido"}`, {
            description: data.request?.details || "Sem detalhes adicionais",
          });

          setNewRequestCount((prev) => prev + 1);
        } else if (data.type === "update") {
          queryClient.invalidateQueries({ queryKey: ["service-requests", hotelId] });
        }
      } catch (e) {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      // SSE failed, will fall back to polling via useQuery
      eventSource.close();
    };

    return () => {
      eventSource.close();
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
      updates.completedAt = new Date().toISOString();
      updates.resolution = "fulfilled";
    }

    if (status === "declined") {
      updates.resolution = "declined_by_staff";
    }

    if (staffResponse) {
      updates.staffResponse = staffResponse;
      updates.respondedAt = new Date().toISOString();
    }

    await api.patch(`/api/services/requests/${id}`, updates);

    queryClient.invalidateQueries({ queryKey: ["service-requests", hotelId] });
  };

  return { updateStatus };
}
