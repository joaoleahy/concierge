import { motion } from "framer-motion";
import { 
  Bath, 
  Sparkles, 
  Clock, 
  Car, 
  Wifi, 
  MapPin, 
  Wrench,
  CalendarDays,
  MessageCircle,
  ClipboardList
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ServiceType } from "@/hooks/useServiceTypes";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  bath: Bath,
  sparkles: Sparkles,
  clock: Clock,
  car: Car,
  wifi: Wifi,
  "map-pin": MapPin,
  wrench: Wrench,
};

// Services that should open chat with pre-filled message (complex services)
const CHAT_SERVICES = ["taxi", "room service"];

// Services that are handled by direct modal (simple services)
const DIRECT_SERVICES = ["extra towels", "housekeeping", "late checkout", "maintenance"];

interface ServiceGridProps {
  services: ServiceType[];
  onDirectServiceClick: (service: ServiceType) => void;
  onChatServiceClick: (service: ServiceType, message: string) => void;
  onWifiClick: () => void;
  onLocalGuideClick: () => void;
  onItineraryClick: () => void;
  onChatClick: () => void;
  onRequestsClick: () => void;
  hasNewUpdate?: boolean;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function ServiceGrid({ 
  services, 
  onDirectServiceClick,
  onChatServiceClick,
  onWifiClick, 
  onLocalGuideClick,
  onItineraryClick,
  onChatClick,
  onRequestsClick,
  hasNewUpdate = false
}: ServiceGridProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  // Filter out room service (has its own flow) and group services
  const quickServices = services.filter(s => s.name.toLowerCase() !== "room service");

  const handleServiceClick = (service: ServiceType) => {
    const serviceLower = service.name.toLowerCase();
    
    // Check if it's a chat service (like taxi)
    if (CHAT_SERVICES.some(s => serviceLower.includes(s))) {
      // Generate a contextual message based on service
      let message = "";
      if (serviceLower.includes("taxi")) {
        message = language === "pt" 
          ? "Preciso de um táxi" 
          : language === "es"
          ? "Necesito un taxi"
          : "I need a taxi";
      } else {
        message = language === "pt"
          ? `Gostaria de solicitar ${service.name_pt || service.name}`
          : language === "es"
          ? `Me gustaría solicitar ${service.name}`
          : `I'd like to request ${service.name}`;
      }
      onChatServiceClick(service, message);
      return;
    }
    
    // Direct modal for simple services
    onDirectServiceClick(service);
  };

  const getDisplayName = (service: ServiceType): string => {
    // First try to get translated name from database
    if (language === "pt" && service.name_pt) {
      return service.name_pt;
    }
    
    // Fallback to service name
    return service.name;
  };

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      variants={container}
      initial="hidden"
      animate="show"
      role="grid"
      aria-label={t("services.title")}
    >
      {/* Quick service items */}
      {quickServices.map((service) => {
        const IconComponent = iconMap[service.icon] || Sparkles;
        const displayName = getDisplayName(service);
        
        return (
          <motion.button
            key={service.id}
            variants={item}
            onClick={() => handleServiceClick(service)}
            className={cn(
              "service-grid-item flex flex-col items-center gap-3 text-center",
              "hover-lift cursor-pointer"
            )}
            aria-label={`${t("services.requestService")}: ${displayName}`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <IconComponent className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">
              {displayName}
            </span>
          </motion.button>
        );
      })}

      {/* WiFi Info */}
      <motion.button
        variants={item}
        onClick={onWifiClick}
        className="service-grid-item flex flex-col items-center gap-3 text-center hover-lift cursor-pointer"
        aria-label={t("wifi.title")}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-concierge-success/10">
          <Wifi className="h-6 w-6 text-concierge-success" />
        </div>
        <span className="text-sm font-medium text-foreground">
          {t("wifi.title")}
        </span>
      </motion.button>

      {/* Local Guide */}
      <motion.button
        variants={item}
        onClick={onLocalGuideClick}
        className="service-grid-item flex flex-col items-center gap-3 text-center hover-lift cursor-pointer"
        aria-label={t("recommendations.title")}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-concierge-gold/10">
          <MapPin className="h-6 w-6 text-concierge-gold" />
        </div>
        <span className="text-sm font-medium text-foreground">
          {t("recommendations.title")}
        </span>
      </motion.button>

      {/* My Itinerary */}
      <motion.button
        variants={item}
        onClick={onItineraryClick}
        className="service-grid-item flex flex-col items-center gap-3 text-center hover-lift cursor-pointer"
        aria-label={t("itinerary.title")}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <CalendarDays className="h-6 w-6 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">
          {t("itinerary.title")}
        </span>
      </motion.button>

      {/* My Requests */}
      <motion.button
        variants={item}
        onClick={onRequestsClick}
        className="service-grid-item flex flex-col items-center gap-3 text-center hover-lift cursor-pointer relative"
        aria-label={`${t("requests.myRequests")}${hasNewUpdate ? " - new update available" : ""}`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-concierge-success/10 relative">
          <ClipboardList className="h-6 w-6 text-concierge-success" />
          {hasNewUpdate && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>
        <span className="text-sm font-medium text-foreground">
          {t("requests.myRequests")}
        </span>
      </motion.button>

      {/* Concierge Chat */}
      <motion.button
        variants={item}
        onClick={onChatClick}
        className="service-grid-item flex flex-col items-center gap-3 text-center hover-lift cursor-pointer"
        aria-label={t("chat.title")}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <MessageCircle className="h-6 w-6 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">
          {t("chat.chatWithConcierge")}
        </span>
      </motion.button>
    </motion.div>
  );
}
