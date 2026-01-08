import { useMemo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItineraryItem } from "@/hooks/useItinerary";

interface WeekTimelineViewProps {
  items: ItineraryItem[];
  weekDates: Date[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onItemClick: (item: ItineraryItem) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
  onItemDrop: (item: ItineraryItem, newDate: Date, newHour: number) => void;
}

const categoryColors: Record<string, string> = {
  restaurant: "#f97316",
  attraction: "#3b82f6",
  beach: "#06b6d4",
  nightlife: "#8b5cf6",
  shopping: "#ec4899",
  tour: "#10b981",
  other: "#6b7280",
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // pixels per hour

export function WeekTimelineView({ 
  items, 
  weekDates,
  selectedDate,
  onSelectDate,
  onItemClick,
  onTimeSlotClick,
  onItemDrop,
}: WeekTimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [draggingItem, setDraggingItem] = useState<ItineraryItem | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const currentHour = new Date().getHours();
      const scrollPosition = Math.max(0, (currentHour - 2) * HOUR_HEIGHT);
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, []);

  // Group items by date
  const itemsByDate = useMemo(() => {
    const map = new Map<string, ItineraryItem[]>();
    weekDates.forEach(date => {
      map.set(date.toDateString(), []);
    });
    items.forEach(item => {
      const dateStr = new Date(item.start_time).toDateString();
      const existing = map.get(dateStr) || [];
      map.set(dateStr, [...existing, item]);
    });
    return map;
  }, [items, weekDates]);

  // Position items on the timeline
  const getItemPosition = (item: ItineraryItem) => {
    const startDate = new Date(item.start_time);
    const endDate = item.end_time ? new Date(item.end_time) : null;
    
    const startHour = startDate.getHours() + startDate.getMinutes() / 60;
    const endHour = endDate 
      ? endDate.getHours() + endDate.getMinutes() / 60
      : startHour + 1;
    
    const top = startHour * HOUR_HEIGHT;
    const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 36);
    
    return { top, height };
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: false 
    });
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const currentHour = new Date().getHours() + new Date().getMinutes() / 60;

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, item: ItineraryItem) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
    setDragPosition({ x: clientX, y: clientY });
    setDraggingItem(item);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingItem) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragPosition({ x: clientX, y: clientY });
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingItem || !gridRef.current || !scrollRef.current) {
      setDraggingItem(null);
      return;
    }

    const clientX = 'touches' in e ? e.changedTouches?.[0]?.clientX ?? dragPosition.x : e.clientX;
    const clientY = 'touches' in e ? e.changedTouches?.[0]?.clientY ?? dragPosition.y : e.clientY;

    const scrollRect = scrollRef.current.getBoundingClientRect();
    const timeColumnWidth = 48; // w-12 = 48px
    
    // Calculate which day column we're over
    const gridContentWidth = scrollRect.width - timeColumnWidth;
    const dayColumnWidth = gridContentWidth / 7;
    const relativeX = clientX - scrollRect.left - timeColumnWidth;
    const dayIndex = Math.floor(relativeX / dayColumnWidth);
    
    // Calculate which hour we're at - use scroll container rect + scrollTop
    const scrollTop = scrollRef.current.scrollTop;
    const relativeY = clientY - scrollRect.top + scrollTop;
    const hour = Math.floor(relativeY / HOUR_HEIGHT);
    
    if (dayIndex >= 0 && dayIndex < 7 && hour >= 0 && hour < 24) {
      const newDate = weekDates[dayIndex];
      onItemDrop(draggingItem, newDate, hour);
    }
    
    setDraggingItem(null);
  };

  return (
    <div 
      className="flex flex-col h-full overflow-hidden"
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
    >
      {/* Week header */}
      <div className="flex border-b bg-background sticky top-0 z-10">
        {/* Time column spacer */}
        <div className="w-12 flex-shrink-0 border-r" />
        
        {/* Day headers */}
        {weekDates.map((date, idx) => (
          <button
            key={idx}
            onClick={() => onSelectDate(date)}
            className={cn(
              "flex-1 py-2 text-center transition-colors border-r last:border-r-0",
              isSelected(date) && "bg-primary text-primary-foreground",
              !isSelected(date) && isToday(date) && "bg-primary/10",
              !isSelected(date) && !isToday(date) && "hover:bg-muted"
            )}
          >
            <div className="text-[10px] uppercase opacity-70">
              {date.toLocaleDateString(undefined, { weekday: "short" })}
            </div>
            <div className="text-lg font-semibold">{date.getDate()}</div>
          </button>
        ))}
      </div>

      {/* Timeline grid */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
      >
        <div 
          ref={gridRef}
          className="relative flex" 
          style={{ height: HOURS.length * HOUR_HEIGHT }}
        >
          {/* Time labels column */}
          <div className="w-12 flex-shrink-0 border-r bg-muted/20 sticky left-0 z-10">
            {HOURS.map(hour => (
              <div 
                key={hour} 
                className="absolute right-1 text-xs text-muted-foreground"
                style={{ top: hour * HOUR_HEIGHT - 6 }}
              >
                {hour > 0 && `${hour.toString().padStart(2, "0")}:00`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDates.map((date, dayIdx) => {
            const dayItems = itemsByDate.get(date.toDateString()) || [];
            
            return (
              <div 
                key={dayIdx} 
                className="flex-1 relative border-r last:border-r-0"
              >
                {/* Hour grid lines and click zones */}
                {HOURS.map(hour => (
                  <button
                    key={hour}
                    className={cn(
                      "absolute left-0 right-0 border-t border-border/40 hover:bg-primary/5 transition-colors",
                      hour === 0 && "border-t-0"
                    )}
                    style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    onClick={() => onTimeSlotClick(date, hour)}
                  />
                ))}

                {/* Current time indicator */}
                {isToday(date) && (
                  <div 
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: currentHour * HOUR_HEIGHT }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                      <div className="flex-1 h-[2px] bg-red-500" />
                    </div>
                  </div>
                )}

                {/* Events */}
                <AnimatePresence>
                  {dayItems.map(item => {
                    if (draggingItem?.id === item.id) return null;
                    
                    const pos = getItemPosition(item);
                    const color = categoryColors[item.category || "other"] || categoryColors.other;
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute left-0.5 right-0.5 rounded overflow-hidden cursor-pointer group z-10 select-none"
                        style={{ 
                          top: pos.top + 1, 
                          height: pos.height - 2,
                          backgroundColor: `${color}20`,
                          borderLeft: `3px solid ${color}`,
                        }}
                        onClick={() => onItemClick(item)}
                      >
                        <div className="flex items-start h-full">
                          {/* Drag handle */}
                          <div 
                            className="flex items-center justify-center w-5 h-full cursor-grab active:cursor-grabbing touch-none opacity-0 group-hover:opacity-60 transition-opacity"
                            onMouseDown={(e) => handleDragStart(e, item)}
                            onTouchStart={(e) => handleDragStart(e, item)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="h-3 w-3 text-muted-foreground" />
                          </div>
                          
                          <div className="flex-1 min-w-0 overflow-hidden py-1 pr-1">
                            <p className="font-medium text-[11px] leading-tight truncate">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatTime(new Date(item.start_time))}
                            </p>
                            {item.location && pos.height > 50 && (
                              <div className="flex items-center gap-0.5 mt-0.5 text-[9px] text-muted-foreground">
                                <MapPin className="h-2.5 w-2.5" />
                                <span className="truncate">{item.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drag preview */}
      {draggingItem && (
        <div
          className="fixed pointer-events-none z-50 rounded p-2 shadow-lg opacity-90"
          style={{
            left: dragPosition.x - dragOffset.x,
            top: dragPosition.y - dragOffset.y,
            backgroundColor: `${categoryColors[draggingItem.category || "other"] || categoryColors.other}30`,
            borderLeft: `3px solid ${categoryColors[draggingItem.category || "other"] || categoryColors.other}`,
            width: 120,
          }}
        >
          <p className="font-medium text-[11px] truncate">{draggingItem.title}</p>
          <p className="text-[10px] text-muted-foreground">
            {formatTime(new Date(draggingItem.start_time))}
          </p>
        </div>
      )}
    </div>
  );
}
