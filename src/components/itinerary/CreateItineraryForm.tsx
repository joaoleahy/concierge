import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Plus, X, MapPin } from "lucide-react";
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

interface CreateItineraryFormProps {
  selectedDate: Date;
  onSubmit: (data: {
    title: string;
    description?: string;
    location?: string;
    category: string;
    startTime: string;
    endTime?: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
  defaultStartTime?: string;
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

export function CreateItineraryForm({
  selectedDate,
  onSubmit,
  onCancel,
  isLoading,
  defaultStartTime,
}: CreateItineraryFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("attraction");
  const [startTime, setStartTime] = useState(defaultStartTime || "10:00");
  const [endTime, setEndTime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      category,
      startTime,
      endTime: endTime || undefined,
    });
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border bg-card p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {selectedDate.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <Input
          placeholder={t("itinerary.activityName")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
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

        <Textarea
          placeholder={`${t("itinerary.notes")} (${t("common.optional")})`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={!title.trim() || isLoading} className="flex-1">
          <Plus className="h-4 w-4 mr-1" />
          {t("common.add")}
        </Button>
      </div>
    </motion.form>
  );
}
