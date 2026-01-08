import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Wifi, Clock, X } from "lucide-react";
import { Hotel } from "@/hooks/useHotel";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WifiCardProps {
  hotel: Hotel;
  onClose: () => void;
}

export function WifiCard({ hotel, onClose }: WifiCardProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copyPassword = async () => {
    if (hotel.wifi_password) {
      await navigator.clipboard.writeText(hotel.wifi_password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-sm shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="relative pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-concierge-success/10">
              <Wifi className="h-5 w-5 text-concierge-success" />
            </div>
            <CardTitle className="text-lg">{t("wifi")}</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Password section */}
          <div className="rounded-lg bg-muted p-4">
            <p className="mb-1 text-xs text-muted-foreground">{t("password")}</p>
            <div className="flex items-center justify-between gap-2">
              <code className="flex-1 font-mono text-lg font-semibold text-foreground">
                {hotel.wifi_password || "—"}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyPassword}
                disabled={!hotel.wifi_password}
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Check className="h-4 w-4 text-concierge-success" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Copy className="h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>

          {/* Hotel info */}
          <div className="space-y-2 text-sm">
            {hotel.breakfast_hours && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{t("breakfast")}: {hotel.breakfast_hours}</span>
              </div>
            )}
            {hotel.checkout_time && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{t("checkout")}: {hotel.checkout_time}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
