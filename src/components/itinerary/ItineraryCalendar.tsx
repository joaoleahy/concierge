import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon,
  X,
  List,
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateItineraryForm } from "./CreateItineraryForm";
import { ListView } from "./ListView";
import { WeekTimelineView } from "./WeekTimelineView";
import { EditItineraryModal } from "./EditItineraryModal";
import { 
  useItinerary, 
  useCreateItineraryItem, 
  useUpdateItineraryItem,
  useDeleteItineraryItem,
  type ItineraryItem,
} from "@/hooks/useItinerary";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ViewMode = "list" | "week";

interface ItineraryCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  hotelId: string;
}

export function ItineraryCalendar({
  isOpen,
  onClose,
  sessionId,
  hotelId,
}: ItineraryCalendarProps) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [defaultStartTime, setDefaultStartTime] = useState<string | null>(null);
  const [formDate, setFormDate] = useState<Date>(new Date());
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);

  const { data: items = [], isLoading } = useItinerary(sessionId);
  const createItem = useCreateItineraryItem();
  const updateItem = useUpdateItineraryItem();
  const deleteItem = useDeleteItineraryItem();

  // Get dates for the week view
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay()); // Start from Sunday
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [selectedDate]);

  // Filter items for selected date (for list view)
  const selectedDateItems = useMemo(() => {
    const dateStr = selectedDate.toDateString();
    return items.filter(item => 
      new Date(item.start_time).toDateString() === dateStr
    ).sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  }, [items, selectedDate]);

  // Filter items for the week (for week view)
  const weekItems = useMemo(() => {
    const weekStart = new Date(weekDates[0]);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekDates[6]);
    weekEnd.setHours(23, 59, 59, 999);
    
    return items.filter(item => {
      const itemDate = new Date(item.start_time);
      return itemDate >= weekStart && itemDate <= weekEnd;
    });
  }, [items, weekDates]);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setSelectedDate(newDate);
  };

  const handleCreate = async (data: {
    title: string;
    description?: string;
    location?: string;
    category: string;
    startTime: string;
    endTime?: string;
  }) => {
    const targetDate = viewMode === "week" ? formDate : selectedDate;
    const startDateTime = new Date(targetDate);
    const [hours, minutes] = data.startTime.split(":").map(Number);
    startDateTime.setHours(hours, minutes, 0, 0);

    let endDateTime: Date | undefined;
    if (data.endTime) {
      endDateTime = new Date(targetDate);
      const [endHours, endMinutes] = data.endTime.split(":").map(Number);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
    }

    try {
      await createItem.mutateAsync({
        session_id: sessionId,
        hotel_id: hotelId,
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        category: data.category,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime?.toISOString() || null,
        google_maps_url: null,
        recommendation_id: null,
      });
      setShowCreateForm(false);
      setDefaultStartTime(null);
      toast.success(t("itinerary.itemAdded"));
    } catch (error) {
      toast.error(t("itinerary.failedToAdd"));
    }
  };

  const handleUpdate = async (item: ItineraryItem, updates: Partial<ItineraryItem>) => {
    try {
      await updateItem.mutateAsync({
        id: item.id,
        sessionId,
        ...updates,
      });
      setEditingItem(null);
      toast.success(t("itinerary.itemUpdated"));
    } catch (error) {
      toast.error(t("itinerary.failedToUpdate"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem.mutateAsync({ id, sessionId });
      toast.success(t("itinerary.itemDeleted"));
    } catch (error) {
      toast.error(t("itinerary.failedToDelete"));
    }
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    setFormDate(date);
    setSelectedDate(date);
    setDefaultStartTime(`${hour.toString().padStart(2, "0")}:00`);
    setShowCreateForm(true);
  };

  const handleAddClick = () => {
    setFormDate(selectedDate);
    setDefaultStartTime(null);
    setShowCreateForm(true);
  };

  const handleItemClick = (item: ItineraryItem) => {
    setEditingItem(item);
  };

  const handleItemDrop = async (item: ItineraryItem, newDate: Date, newHour: number) => {
    const oldStart = new Date(item.start_time);
    const oldEnd = item.end_time ? new Date(item.end_time) : null;
    
    // Calculate duration
    const durationMs = oldEnd ? oldEnd.getTime() - oldStart.getTime() : 60 * 60 * 1000;
    
    // Create new start time
    const newStart = new Date(newDate);
    newStart.setHours(newHour, 0, 0, 0);
    
    // Create new end time
    const newEnd = new Date(newStart.getTime() + durationMs);

    try {
      await updateItem.mutateAsync({
        id: item.id,
        sessionId,
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
      });
      toast.success(t("itinerary.itemMoved"));
    } catch (error) {
      toast.error(t("itinerary.failedToMove"));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-50 flex flex-col bg-background"
        >
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">{t("itinerary.title")}</h2>
            </div>
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors",
                    viewMode === "list" 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("itinerary.views.list")}</span>
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={cn(
                    "px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors",
                    viewMode === "week" 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("itinerary.views.week")}</span>
                </button>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {/* Week Navigator */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
            <Button variant="ghost" size="icon" onClick={() => navigateWeek(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <span className="font-medium text-sm">
                {weekDates[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} - {weekDates[6].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
              {viewMode === "week" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddClick}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  {t("common.add")}
                </Button>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigateWeek(1)}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Create Form Modal */}
          <AnimatePresence>
            {showCreateForm && viewMode === "week" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setShowCreateForm(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full max-w-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CreateItineraryForm
                    selectedDate={formDate}
                    onSubmit={handleCreate}
                    onCancel={() => {
                      setShowCreateForm(false);
                      setDefaultStartTime(null);
                    }}
                    isLoading={createItem.isPending}
                    defaultStartTime={defaultStartTime || undefined}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Edit Modal */}
          <EditItineraryModal
            item={editingItem}
            isOpen={!!editingItem}
            onClose={() => setEditingItem(null)}
            onSave={handleUpdate}
            onDelete={handleDelete}
            isLoading={updateItem.isPending}
          />

          {/* Content based on view mode */}
          {viewMode === "list" ? (
            <>
              {/* Day selector for list view */}
              <div className="grid grid-cols-7 gap-1 px-2 py-3 border-b">
                {weekDates.map((date, idx) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  const dayItems = items.filter(i => new Date(i.start_time).toDateString() === date.toDateString());
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "flex flex-col items-center py-2 rounded-lg transition-colors",
                        isSelected && "bg-primary text-primary-foreground",
                        !isSelected && isToday && "bg-primary/10",
                        !isSelected && !isToday && "hover:bg-muted"
                      )}
                    >
                      <span className="text-[10px] uppercase opacity-70">
                        {date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3)}
                      </span>
                      <span className="text-lg font-semibold">{date.getDate()}</span>
                      {dayItems.length > 0 && (
                        <div className={cn(
                          "flex gap-0.5 mt-1",
                          isSelected ? "text-primary-foreground" : "text-primary"
                        )}>
                          {Array.from({ length: Math.min(dayItems.length, 3) }).map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-current" />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <ListView
                items={selectedDateItems}
                selectedDate={selectedDate}
                showCreateForm={showCreateForm}
                setShowCreateForm={setShowCreateForm}
                onDelete={handleDelete}
                onItemClick={handleItemClick}
                onCreate={handleCreate}
                isCreating={createItem.isPending}
              />
            </>
          ) : (
            <WeekTimelineView
              items={weekItems}
              weekDates={weekDates}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onItemClick={handleItemClick}
              onTimeSlotClick={handleTimeSlotClick}
              onItemDrop={handleItemDrop}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
