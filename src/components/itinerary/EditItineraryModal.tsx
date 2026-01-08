import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { X, MapPin, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ItineraryItem } from "@/hooks/useItinerary";

interface EditItineraryModalProps {
  item: ItineraryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ItineraryItem, updates: Partial<ItineraryItem>) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const categoryKeys = [
  "restaurant",
  "attraction",
  "beach",
  "nightlife",
  "shopping",
  "tour",
  "other",
] as const;

const categoryEmojis: Record<string, string> = {
  restaurant: "🍽️",
  attraction: "🏛️",
  beach: "🏖️",
  nightlife: "🌙",
  shopping: "🛍️",
  tour: "🚶",
  other: "📍",
};

export function EditItineraryModal({
  item,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isLoading,
}: EditItineraryModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("attraction");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description || "");
      setLocation(item.location || "");
      setCategory(item.category || "other");
      
      const start = new Date(item.start_time);
      setStartTime(start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
      setDate(start.toISOString().split("T")[0]);
      
      if (item.end_time) {
        const end = new Date(item.end_time);
        setEndTime(end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
      } else {
        setEndTime("");
      }
    }
  }, [item]);

  const handleSave = () => {
    if (!item || !title.trim()) return;

    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDateTime = new Date(year, month - 1, day, hours, minutes);

    let endDateTime: Date | null = null;
    if (endTime) {
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      endDateTime = new Date(year, month - 1, day, endHours, endMinutes);
    }

    onSave(item, {
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      category,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime?.toISOString() || null,
    });
  };

  const handleDelete = () => {
    if (item) {
      onDelete(item.id);
      onClose();
    }
  };

  if (!item) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md bg-card rounded-xl border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">{t("itinerary.editActivity")}</h3>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <Input
                placeholder={t("itinerary.activityName")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryKeys.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {categoryEmojis[cat]} {t(`itinerary.categories.${cat}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("itinerary.date")}</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">{t("itinerary.start")}</label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">{t("itinerary.end")} ({t("common.optional")})</label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`${t("itinerary.location")} (${t("common.optional")})`}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-9"
                />
              </div>

              {item.google_maps_url && (
                <a
                  href={item.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("recommendations.openMaps")}
                </a>
              )}

              <Textarea
                placeholder={`${t("itinerary.notes")} (${t("common.optional")})`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between p-4 border-t">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="gap-1"
              >
                <Trash2 className="h-4 w-4" />
                {t("common.delete")}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  {t("common.cancel")}
                </Button>
                <Button onClick={handleSave} disabled={!title.trim() || isLoading}>
                  {t("itinerary.saveChanges")}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
