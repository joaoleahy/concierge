import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AdminServiceTypesProps {
  hotelId: string;
}

const getIconOptions = (t: (key: string) => string) => [
  { value: "bell-concierge", label: t("admin.services.icons.concierge") },
  { value: "utensils", label: t("admin.services.icons.restaurant") },
  { value: "bed", label: t("admin.services.icons.room") },
  { value: "shirt", label: t("admin.services.icons.laundry") },
  { value: "car", label: t("admin.services.icons.transport") },
  { value: "sparkles", label: t("admin.services.icons.cleaning") },
  { value: "wifi", label: t("admin.services.icons.wifi") },
  { value: "wrench", label: t("admin.services.icons.maintenance") },
  { value: "heart", label: t("admin.services.icons.wellness") },
  { value: "calendar", label: t("admin.services.icons.reservations") },
];

export function AdminServiceTypes({ hotelId }: AdminServiceTypesProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["service-types", hotelId],
    queryFn: async () => {
      const data = await api.get<any[]>(`/api/admin/service-types?hotelId=${hotelId}`);
      return data;
    },
    enabled: !!hotelId,
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = services.findIndex((s: any) => s.id === active.id);
    const newIndex = services.findIndex((s: any) => s.id === over.id);

    const reordered = arrayMove(services, oldIndex, newIndex);

    // Optimistic update
    queryClient.setQueryData(["service-types", hotelId], reordered);

    // Update sort_order in database
    try {
      const updates = reordered.map((service: any, index: number) =>
        api.patch(`/api/admin/service-types/${service.id}`, { sortOrder: index })
      );
      await Promise.all(updates);
      toast.success(t("toast.orderUpdated"));
    } catch (error) {
      queryClient.invalidateQueries({ queryKey: ["service-types", hotelId] });
      toast.error(t("toast.errors.reorder"));
    }
  };

  const handleSave = async (service: any) => {
    try {
      if (service.id) {
        await api.patch(`/api/admin/service-types/${service.id}`, {
          name: service.name,
          namePt: service.name_pt,
          description: service.description,
          icon: service.icon,
          requiresDetails: service.requires_details,
          detailsPlaceholder: service.details_placeholder,
          whatsappTemplate: service.whatsapp_template,
          whatsappTemplatePt: service.whatsapp_template_pt,
          isActive: service.is_active,
          sortOrder: service.sort_order,
        });
      } else {
        const maxOrder = services.length > 0 ? Math.max(...services.map((s: any) => s.sort_order || 0)) : 0;
        await api.post("/api/admin/service-types", {
          ...service,
          hotelId,
          sortOrder: maxOrder + 1,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["service-types"] });
      setEditing(null);
      setIsAdding(false);
      toast.success(t("toast.saved"));
    } catch (error) {
      console.error(error);
      toast.error(t("toast.errors.save"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirm.deleteService"))) return;
    try {
      await api.delete(`/api/admin/service-types/${id}`);
      queryClient.invalidateQueries({ queryKey: ["service-types"] });
      toast.success(t("toast.deleted"));
    } catch (error) {
      toast.error(t("toast.errors.delete"));
    }
  };

  const toggleActive = async (service: any) => {
    try {
      await api.patch(`/api/admin/service-types/${service.id}`, {
        isActive: !service.is_active,
      });
      queryClient.invalidateQueries({ queryKey: ["service-types"] });
      toast.success(t("toast.saved"));
    } catch (error) {
      toast.error(t("toast.errors.update"));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("admin.services.title")}</CardTitle>
            <CardDescription>{t("admin.services.description")}</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> {t("common.add")}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : services.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t("admin.services.noServices")}
            </p>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={services.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {services.map((service: any) => (
                    <SortableServiceItem
                      key={service.id}
                      service={service}
                      onEdit={() => setEditing(service)}
                      onDelete={() => handleDelete(service.id)}
                      onToggleActive={() => toggleActive(service)}
                      t={t}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing || isAdding} onOpenChange={(open) => { if (!open) { setEditing(null); setIsAdding(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? t("admin.services.edit") : t("admin.services.new")} {t("admin.services.title")}</DialogTitle>
          </DialogHeader>
          <ServiceForm
            t={t}
            service={editing || {
              name: "",
              name_pt: "",
              description: "",
              icon: "bell-concierge",
              requires_details: false,
              details_placeholder: "",
              whatsapp_template: "",
              whatsapp_template_pt: "",
              is_active: true,
            }}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setIsAdding(false); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SortableServiceItemProps {
  service: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  t: (key: string) => string;
}

function SortableServiceItem({ service, onEdit, onDelete, onToggleActive, t }: SortableServiceItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 rounded-lg border ${
        service.is_active ? "bg-muted/30" : "bg-muted/10 opacity-60"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{service.name}</span>
          {service.name_pt && (
            <span className="text-sm text-muted-foreground">/ {service.name_pt}</span>
          )}
          {!service.is_active && (
            <Badge variant="secondary">{t("admin.services.inactive")}</Badge>
          )}
        </div>
        {service.description && (
          <p className="text-sm text-muted-foreground truncate">{service.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleActive}
          title={service.is_active ? t("common.deactivate") : t("common.activate")}
        >
          {service.is_active ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={onEdit}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

function ServiceForm({ service, onSave, onCancel, t }: { service: any; onSave: (s: any) => void; onCancel: () => void; t: (key: string) => string }) {
  const [data, setData] = useState({ ...service });
  const iconOptions = getIconOptions(t);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("admin.services.form.nameEN")}</Label>
          <Input
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            placeholder="Room Service"
          />
        </div>
        <div className="space-y-2">
          <Label>{t("admin.services.form.namePT")}</Label>
          <Input
            value={data.name_pt || ""}
            onChange={(e) => setData({ ...data, name_pt: e.target.value })}
            placeholder="Serviço de Quarto"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("admin.services.form.description")}</Label>
        <Textarea
          value={data.description || ""}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("admin.services.form.icon")}</Label>
          <select
            value={data.icon}
            onChange={(e) => setData({ ...data, icon: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {iconOptions.map((icon) => (
              <option key={icon.value} value={icon.value}>{icon.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2 flex items-end">
          <div className="flex items-center gap-2">
            <Switch
              checked={data.requires_details}
              onCheckedChange={(checked) => setData({ ...data, requires_details: checked })}
            />
            <Label className="cursor-pointer">{t("admin.services.form.requiresDetails")}</Label>
          </div>
        </div>
      </div>

      {data.requires_details && (
        <div className="space-y-2">
          <Label>{t("admin.services.form.detailsPlaceholder")}</Label>
          <Input
            value={data.details_placeholder || ""}
            onChange={(e) => setData({ ...data, details_placeholder: e.target.value })}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>{t("admin.services.form.whatsappTemplateEN")}</Label>
        <Textarea
          value={data.whatsapp_template || ""}
          onChange={(e) => setData({ ...data, whatsapp_template: e.target.value })}
          placeholder="Room {room_number} requests {service_name}. Details: {details}"
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          {t("common.variables")}: {"{room_number}"}, {"{service_name}"}, {"{details}"}
        </p>
      </div>

      <div className="space-y-2">
        <Label>{t("admin.services.form.whatsappTemplatePT")}</Label>
        <Textarea
          value={data.whatsapp_template_pt || ""}
          onChange={(e) => setData({ ...data, whatsapp_template_pt: e.target.value })}
          placeholder="Quarto {room_number} solicita {service_name}. Detalhes: {details}"
          rows={2}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={data.is_active}
          onCheckedChange={(checked) => setData({ ...data, is_active: checked })}
        />
        <Label className="cursor-pointer">{t("admin.services.form.active")}</Label>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>{t("common.cancel")}</Button>
        <Button onClick={() => onSave(data)} disabled={!data.name || !data.whatsapp_template}>
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}
