import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

const iconOptions = [
  { value: "bell-concierge", label: "Concierge" },
  { value: "utensils", label: "Restaurante" },
  { value: "bed", label: "Quarto" },
  { value: "shirt", label: "Lavanderia" },
  { value: "car", label: "Transporte" },
  { value: "sparkles", label: "Limpeza" },
  { value: "wifi", label: "WiFi" },
  { value: "wrench", label: "Manutenção" },
  { value: "heart", label: "Bem-estar" },
  { value: "calendar", label: "Reservas" },
];

export function AdminServiceTypes({ hotelId }: AdminServiceTypesProps) {
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
      toast.success("Ordem atualizada!");
    } catch (error) {
      queryClient.invalidateQueries({ queryKey: ["service-types", hotelId] });
      toast.error("Erro ao reordenar");
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
      toast.success("Serviço salvo!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este serviço?")) return;
    try {
      await api.delete(`/api/admin/service-types/${id}`);
      queryClient.invalidateQueries({ queryKey: ["service-types"] });
      toast.success("Excluído!");
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const toggleActive = async (service: any) => {
    try {
      await api.patch(`/api/admin/service-types/${service.id}`, {
        isActive: !service.is_active,
      });
      queryClient.invalidateQueries({ queryKey: ["service-types"] });
      toast.success(service.is_active ? "Serviço desativado" : "Serviço ativado");
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Serviços</CardTitle>
            <CardDescription>Configure os serviços disponíveis para os hóspedes</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : services.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum serviço cadastrado. Adicione serviços para seus hóspedes.
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
            <DialogTitle>{editing?.id ? "Editar" : "Novo"} Serviço</DialogTitle>
          </DialogHeader>
          <ServiceForm
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
}

function SortableServiceItem({ service, onEdit, onDelete, onToggleActive }: SortableServiceItemProps) {
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
            <Badge variant="secondary">Inativo</Badge>
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
          title={service.is_active ? "Desativar" : "Ativar"}
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

function ServiceForm({ service, onSave, onCancel }: { service: any; onSave: (s: any) => void; onCancel: () => void }) {
  const [data, setData] = useState({ ...service });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nome (EN)</Label>
          <Input 
            value={data.name} 
            onChange={(e) => setData({ ...data, name: e.target.value })} 
            placeholder="Room Service"
          />
        </div>
        <div className="space-y-2">
          <Label>Nome (PT)</Label>
          <Input 
            value={data.name_pt || ""} 
            onChange={(e) => setData({ ...data, name_pt: e.target.value })} 
            placeholder="Serviço de Quarto"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea 
          value={data.description || ""} 
          onChange={(e) => setData({ ...data, description: e.target.value })} 
          placeholder="Descrição breve do serviço..."
          rows={2}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Ícone</Label>
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
            <Label className="cursor-pointer">Requer detalhes do hóspede</Label>
          </div>
        </div>
      </div>

      {data.requires_details && (
        <div className="space-y-2">
          <Label>Placeholder para detalhes</Label>
          <Input 
            value={data.details_placeholder || ""} 
            onChange={(e) => setData({ ...data, details_placeholder: e.target.value })} 
            placeholder="Ex: Descreva sua solicitação..."
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Template WhatsApp (EN)</Label>
        <Textarea 
          value={data.whatsapp_template || ""} 
          onChange={(e) => setData({ ...data, whatsapp_template: e.target.value })} 
          placeholder="Room {room_number} requests {service_name}. Details: {details}"
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          Variáveis: {"{room_number}"}, {"{service_name}"}, {"{details}"}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Template WhatsApp (PT)</Label>
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
        <Label className="cursor-pointer">Serviço ativo</Label>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSave(data)} disabled={!data.name || !data.whatsapp_template}>
          Salvar
        </Button>
      </div>
    </div>
  );
}
