import { useState, useCallback, useEffect } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { useHotelByQR, DEMO_QR_CODE } from "@/hooks/useHotel";
import { useServiceTypes, ServiceType } from "@/hooks/useServiceTypes";
import { useGuestSession } from "@/hooks/useGuestSession";
import { useGuestRequests } from "@/hooks/useGuestRequests";
import { HotelHeader } from "@/components/guest/HotelHeader";
import { ServiceGrid } from "@/components/guest/ServiceGrid";
import { WifiCard } from "@/components/guest/WifiCard";
import { DirectServiceModal } from "@/components/guest/DirectServiceModal";
import { ConciergeChat } from "@/components/chat/ConciergeChat";
import { ItineraryCalendar } from "@/components/itinerary/ItineraryCalendar";
import { PinVerificationModal } from "@/components/guest/PinVerificationModal";
import { MyRequestsSheet } from "@/components/guest/MyRequestsSheet";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/playfair-display/700.css";

export default function GuestHome() {
  const search = useSearch({ from: "/" });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const qrCode = (search as { room?: string }).room || DEMO_QR_CODE;
  
  const { data, isLoading, error } = useHotelByQR(qrCode);
  const { data: services = [] } = useServiceTypes(data?.hotel?.id || null);

  const [showWifi, setShowWifi] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | null>(null);

  // Get or create guest session with PIN verification
  const { sessionId, isVerified, isLoading: sessionLoading, verifySession } = useGuestSession(
    data?.hotel?.id || null, 
    data?.room?.id || null
  );

  // Get guest requests with realtime updates
  const { requests, isLoading: requestsLoading, hasNewUpdate, clearNewUpdate } = useGuestRequests(
    data?.room?.id || null
  );

  // Handle PIN verification success
  const handlePinVerified = useCallback((sessionData: { hotelId: string; roomId: string }) => {
    verifySession(sessionData);
  }, [verifySession]);

  // Handle direct service modal (simple services like housekeeping, towels)
  const handleDirectServiceClick = useCallback((service: ServiceType) => {
    setSelectedService(service);
  }, []);

  // Handle chat service (complex services like taxi)
  const handleChatServiceClick = useCallback((service: ServiceType, message: string) => {
    setChatInitialMessage(message);
    setShowChat(true);
  }, []);

  // Handle chat close
  const handleChatClose = useCallback(() => {
    setShowChat(false);
    setChatInitialMessage(null);
  }, []);

  // Handle requests sheet open and clear new update flag
  const handleOpenRequests = useCallback(() => {
    setShowRequests(true);
    clearNewUpdate();
  }, [clearNewUpdate]);

  // Show toast when staff responds
  useEffect(() => {
    if (hasNewUpdate) {
      toast.info(t("requests.myRequests"), {
        description: t("requests.staffResponse").replace(":", ""),
      });
    }
  }, [hasNewUpdate, t]);

  if (isLoading || sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <h1 className="text-xl font-semibold">{t("errors.roomNotFound")}</h1>
        <p className="text-muted-foreground">{t("errors.scanQrCode")}</p>
      </div>
    );
  }

  const { room, hotel } = data;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* PIN Verification Modal - shows when not verified */}
      <PinVerificationModal
        isOpen={!isVerified}
        roomId={room.id}
        roomNumber={room.room_number}
        hotelName={hotel.name}
        onVerified={handlePinVerified}
      />

      <div className="mx-auto max-w-lg px-4 py-6">
        <HotelHeader hotel={hotel} roomNumber={room.room_number} />
        
        <section className="mt-6">
          <ServiceGrid
            services={services}
            onDirectServiceClick={handleDirectServiceClick}
            onChatServiceClick={handleChatServiceClick}
            onWifiClick={() => setShowWifi(true)}
            onLocalGuideClick={() => navigate(`/local-guide?room=${qrCode}`)}
            onItineraryClick={() => setShowItinerary(true)}
            onChatClick={() => setShowChat(true)}
            onRequestsClick={handleOpenRequests}
            hasNewUpdate={hasNewUpdate}
          />
        </section>
      </div>

      {/* Direct Service Modal */}
      <AnimatePresence>
        {selectedService && (
          <DirectServiceModal
            service={selectedService}
            roomId={room.id}
            roomNumber={room.room_number}
            hotelId={hotel.id}
            onClose={() => setSelectedService(null)}
          />
        )}
      </AnimatePresence>

      {/* WiFi Modal */}
      <AnimatePresence>
        {showWifi && (
          <WifiCard hotel={hotel} onClose={() => setShowWifi(false)} />
        )}
      </AnimatePresence>

      {/* Concierge Chat */}
      <ConciergeChat
        isOpen={showChat}
        onClose={handleChatClose}
        sessionId={sessionId || ""}
        hotelId={hotel.id}
        roomId={room.id}
        roomNumber={room.room_number}
        hotelName={hotel.name}
        initialMessage={chatInitialMessage}
      />

      {/* Itinerary Calendar */}
      <ItineraryCalendar
        isOpen={showItinerary}
        onClose={() => setShowItinerary(false)}
        sessionId={sessionId || ""}
        hotelId={hotel.id}
      />

      {/* My Requests Sheet */}
      <MyRequestsSheet
        isOpen={showRequests}
        onClose={() => setShowRequests(false)}
        requests={requests}
        isLoading={requestsLoading}
      />
    </div>
  );
}
