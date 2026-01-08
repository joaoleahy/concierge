import { AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItineraryCard } from "./ItineraryCard";
import { CreateItineraryForm } from "./CreateItineraryForm";
import type { ItineraryItem } from "@/hooks/useItinerary";

interface ListViewProps {
  items: ItineraryItem[];
  selectedDate: Date;
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;
  onDelete: (id: string) => void;
  onItemClick: (item: ItineraryItem) => void;
  onCreate: (data: {
    title: string;
    description?: string;
    location?: string;
    category: string;
    startTime: string;
    endTime?: string;
  }) => void;
  isCreating: boolean;
}

export function ListView({
  items,
  selectedDate,
  showCreateForm,
  setShowCreateForm,
  onDelete,
  onItemClick,
  onCreate,
  isCreating,
}: ListViewProps) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    // For now, drag just reorders visually
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">
          {selectedDate.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h3>
        {!showCreateForm && (
          <Button
            size="sm"
            onClick={() => setShowCreateForm(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            {t("common.add")}
          </Button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {showCreateForm && (
          <div className="mb-4">
            <CreateItineraryForm
              selectedDate={selectedDate}
              onSubmit={onCreate}
              onCancel={() => setShowCreateForm(false)}
              isLoading={isCreating}
            />
          </div>
        )}
      </AnimatePresence>

      {items.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map(i => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              <AnimatePresence>
                {items.map((item) => (
                  <ItineraryCard
                    key={item.id}
                    item={item}
                    onDelete={() => onDelete(item.id)}
                    onClick={() => onItemClick(item)}
                    isDragging={false}
                  />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      ) : !showCreateForm ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">
            {t("itinerary.noActivities")}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t("itinerary.addActivity")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
