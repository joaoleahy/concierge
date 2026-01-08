import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, ExternalLink } from "lucide-react";
import { ServiceType, generateWhatsAppLink } from "@/hooks/useServiceTypes";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ServiceRequestModalProps {
  service: ServiceType;
  roomNumber: string;
  whatsappNumber: string;
  hotelLanguage: string;
  onClose: () => void;
}

export function ServiceRequestModal({
  service,
  roomNumber,
  whatsappNumber,
  hotelLanguage,
  onClose,
}: ServiceRequestModalProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [details, setDetails] = useState("");

  const displayName = language === "pt" && service.name_pt 
    ? service.name_pt 
    : service.name;

  // Use Portuguese template if hotel is in Brazil
  const template = hotelLanguage === "pt-BR" && service.whatsapp_template_pt
    ? service.whatsapp_template_pt
    : service.whatsapp_template;

  const handleSendRequest = () => {
    if (service.requires_details && !details.trim()) {
      toast({
        title: "Please provide details",
        variant: "destructive",
      });
      return;
    }

    const whatsappUrl = generateWhatsAppLink(
      whatsappNumber,
      template,
      roomNumber,
      details || undefined
    );

    // Show confirmation toast
    toast({
      title: t("openingWhatsApp"),
      description: `${t("room")} ${roomNumber}`,
    });

    // Open WhatsApp
    window.open(whatsappUrl, "_blank");
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="rounded-b-none rounded-t-2xl shadow-elevated sm:rounded-2xl">
          <CardHeader className="relative pb-2">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg">{displayName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("room")} {roomNumber}
            </p>
          </CardHeader>

          <CardContent className="space-y-4 pb-6">
            {service.requires_details && (
              <div className="space-y-2">
                <Label htmlFor="details">{service.details_placeholder || "Details"}</Label>
                <Input
                  id="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={service.details_placeholder || "Enter details..."}
                  className="h-12"
                />
              </div>
            )}

            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                This will open WhatsApp to send your request directly to our team.
              </p>
            </div>

            <Button 
              onClick={handleSendRequest}
              className="h-12 w-full gap-2"
              size="lg"
            >
              {t("sendRequest")}
              <ExternalLink className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
