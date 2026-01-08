import { useState } from "react";
import { motion } from "framer-motion";
import { X, Check, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ServiceType } from "@/hooks/useServiceTypes";
import { useLanguage } from "@/hooks/useLanguage";

interface DirectServiceModalProps {
  service: ServiceType;
  roomId: string | null;
  roomNumber: string;
  hotelId: string;
  onClose: () => void;
}

export function DirectServiceModal({
  service,
  roomId,
  roomNumber,
  hotelId,
  onClose,
}: DirectServiceModalProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [details, setDetails] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  const displayName = language === "pt" && service.name_pt 
    ? service.name_pt 
    : service.name;

  // Determine what fields to show based on service type
  const serviceLower = service.name.toLowerCase();
  const isLateCheckout = serviceLower.includes("checkout") || serviceLower.includes("late");
  const isMaintenance = serviceLower.includes("maintenance") || serviceLower.includes("repair");
  const needsTime = isLateCheckout || serviceLower.includes("housekeeping");

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Build details string
      let fullDetails = details;
      if (preferredTime) {
        fullDetails = preferredTime + (details ? ` - ${details}` : "");
      }

      const { error } = await supabase.from("service_requests").insert({
        hotel_id: hotelId,
        room_id: roomId,
        request_type: service.name,
        service_type_id: service.id,
        details: fullDetails || null,
        guest_language: language,
        status: "pending",
      });

      if (error) throw error;

      setShowSuccess(true);
      
      // Auto close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error("Error creating service request:", error);
      toast.error("Failed to send request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
          >
            <Check className="h-8 w-8 text-green-600" />
          </motion.div>
          <h2 className="text-xl font-semibold">{t("services.requestSent")}</h2>
          <p className="mt-2 text-muted-foreground">
            {t("services.staffNotified")}
          </p>
        </motion.div>
      </motion.div>
    );
  }

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
              {t("header.room")} {roomNumber}
            </p>
          </CardHeader>

          <CardContent className="space-y-4 pb-6">
            {/* Time picker for services that need it */}
            {needsTime && (
              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {isLateCheckout ? t("services.lateCheckoutTime") : t("services.preferredTime")}
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="h-12"
                />
              </div>
            )}

            {/* Details/description field */}
            {(service.requires_details || isMaintenance) && (
              <div className="space-y-2">
                <Label htmlFor="details">
                  {isMaintenance ? t("services.issueDescription") : t("services.description")}
                </Label>
                <Textarea
                  id="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={service.details_placeholder || t("services.detailsPlaceholder")}
                  className="min-h-[80px] resize-none"
                />
              </div>
            )}

            <Button 
              onClick={handleSubmit}
              className="h-12 w-full"
              size="lg"
              disabled={isSubmitting || (isMaintenance && !details.trim())}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("common.loading")}
                </span>
              ) : (
                t("services.sendRequest")
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}