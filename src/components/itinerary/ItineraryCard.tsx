import { forwardRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, MapPin, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItineraryItem } from "@/hooks/useItinerary";

const categoryColors: Record<string, string> = {
  restaurant: "bg-orange-500",
  attraction: "bg-blue-500",
  beach: "bg-cyan-500",
  nightlife: "bg-purple-500",
  shopping: "bg-pink-500",
  tour: "bg-green-500",
  other: "bg-gray-500",
};

const categoryEmojis: Record<string, string> = {
  restaurant: "🍽️",
  attraction: "🏛️",
  beach: "🏖️",
  nightlife: "🌙",
  shopping: "🛍️",
  tour: "🚶",
  other: "📍",
};

interface ItineraryCardProps {
  item: ItineraryItem;
  onDelete?: () => void;
  onClick?: () => void;
  isDragging?: boolean;
}

export const ItineraryCard = forwardRef<HTMLDivElement, ItineraryCardProps>(
  function ItineraryCard({ item, onDelete, onClick, isDragging }, ref) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const startTime = new Date(item.start_time);
    const endTime = item.end_time ? new Date(item.end_time) : null;

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    // Combine refs
    const handleRef = (node: HTMLDivElement | null) => {
      setNodeRef(node);
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    return (
      <motion.div
        ref={handleRef}
        style={style}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "group relative flex gap-3 rounded-xl border bg-card p-3 shadow-sm cursor-pointer",
          "transition-shadow hover:shadow-md",
          isDragging && "shadow-lg ring-2 ring-primary/20"
        )}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex cursor-grab items-center text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Time column */}
        <div className="flex flex-col items-center gap-1 text-center min-w-[50px]">
          <span className="text-sm font-semibold text-foreground">
            {formatTime(startTime)}
          </span>
          {endTime && (
            <>
              <div className="h-4 w-px bg-border" />
              <span className="text-xs text-muted-foreground">
                {formatTime(endTime)}
              </span>
            </>
          )}
        </div>

        {/* Category indicator */}
        <div className={cn(
          "w-1 rounded-full shrink-0",
          categoryColors[item.category] || categoryColors.other
        )} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <span className="text-lg">{categoryEmojis[item.category] || "📍"}</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground truncate">{item.title}</h4>
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                  {item.description}
                </p>
              )}
              {item.location && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{item.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={onDelete}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </motion.div>
    );
  }
);
