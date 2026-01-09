import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api/client";

interface GuestSessionState {
  sessionId: string | null;
  isVerified: boolean;
  isLoading: boolean;
}

interface VerifiedSessionData {
  hotelId: string;
  roomId: string;
}

export function useGuestSession(hotelId: string | null, roomId: string | null) {
  const [state, setState] = useState<GuestSessionState>({
    sessionId: null,
    isVerified: false,
    isLoading: true,
  });

  // Check for existing verified session on mount
  useEffect(() => {
    if (!hotelId || !roomId) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    const checkExistingSession = async () => {
      const existingSessionId = sessionStorage.getItem("chat-session-id");
      const verifiedRoomId = sessionStorage.getItem("verified-room-id");
      const verifiedAt = sessionStorage.getItem("verified-at");

      // Check if session is still valid (not expired - 24h max)
      if (existingSessionId && verifiedRoomId === roomId && verifiedAt) {
        const verifiedTime = new Date(verifiedAt).getTime();
        const now = Date.now();
        const hoursSinceVerification = (now - verifiedTime) / (1000 * 60 * 60);

        // Session valid for 24 hours
        if (hoursSinceVerification < 24) {
          setState({
            sessionId: existingSessionId,
            isVerified: true,
            isLoading: false,
          });
          return;
        }
      }

      // Clear expired session data
      sessionStorage.removeItem("chat-session-id");
      sessionStorage.removeItem("verified-room-id");
      sessionStorage.removeItem("verified-at");

      setState({
        sessionId: null,
        isVerified: false,
        isLoading: false,
      });
    };

    checkExistingSession();
  }, [hotelId, roomId]);

  // Function to mark session as verified after PIN check
  const verifySession = useCallback(
    async (verifiedData: VerifiedSessionData) => {
      if (!hotelId) return;

      setState((s) => ({ ...s, isLoading: true }));

      try {
        // Create new verified session via API
        const data = await api.post<{ id: string }>("/api/chat/session", {
          hotelId: verifiedData.hotelId,
          roomId: verifiedData.roomId,
        });

        if (data?.id) {
          sessionStorage.setItem("chat-session-id", data.id);
          sessionStorage.setItem("verified-room-id", verifiedData.roomId);
          sessionStorage.setItem("verified-at", new Date().toISOString());

          setState({
            sessionId: data.id,
            isVerified: true,
            isLoading: false,
          });
        } else {
          console.error("Failed to create session");
          setState((s) => ({ ...s, isLoading: false }));
        }
      } catch (err) {
        console.error("Error creating session:", err);
        setState((s) => ({ ...s, isLoading: false }));
      }
    },
    [hotelId]
  );

  // Function to clear session (logout)
  const clearSession = useCallback(() => {
    sessionStorage.removeItem("chat-session-id");
    sessionStorage.removeItem("verified-room-id");
    sessionStorage.removeItem("verified-at");
    setState({
      sessionId: null,
      isVerified: false,
      isLoading: false,
    });
  }, []);

  return {
    sessionId: state.sessionId,
    isVerified: state.isVerified,
    isLoading: state.isLoading,
    verifySession,
    clearSession,
  };
}
