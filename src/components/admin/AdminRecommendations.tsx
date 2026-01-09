import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, MapPin, Star } from "lucide-react";
import { api } from "@/lib/api/client";
import { useLocalRecommendations } from "@/hooks/useLocalRecommendations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AdminRecommendationsProps {
  hotelId: string | null;
}

const categories = [
  { value: "restaurant", label: "Restaurante" },
  { value: "bar", label: "Bar" },
  { value: "beach", label: "Praia" },
  { value: "attraction", label: "Atração" },
  { value: "shopping", label: "Compras" },
  { value: "nature", label: "Natureza" },
];

export function AdminRecommendations({ hotelId }: AdminRecommendationsProps) {
  const queryClient = useQueryClient();
  const { data: recommendations = [] } = useLocalRecommendations(hotelId);
  const [editing, setEditing] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleSave = async (rec: any) => {
    try {
      if (rec.id) {
        await api.patch(`/api/admin/recommendations/${rec.id}`, {
          name: rec.name,
          namePt: rec.name_pt,
          description: rec.description,
          descriptionPt: rec.description_pt,
          category: rec.category,
          address: rec.address,
          googleMapsUrl: rec.google_maps_url,
          priceRange: rec.price_range,
          isHiddenGem: rec.is_hidden_gem,
          isActive: rec.is_active,
        });
      } else {
        await api.post("/api/admin/recommendations", { ...rec, hotelId });
      }
      queryClient.invalidateQueries({ queryKey: ["local-recommendations"] });
      setEditing(null);
      setIsAdding(false);
      toast.success("Recomendação salva!");
    } catch (error) {
      toast.error("Erro ao salvar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta recomendação?")) return;
    try {
      await api.delete(`/api/admin/recommendations/${id}`);
      queryClient.invalidateQueries({ queryKey: ["local-recommendations"] });
      toast.success("Excluído!");
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  if (!hotelId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum hotel selecionado
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recomendações Locais</CardTitle>
            <CardDescription>Lugares que você recomenda aos hóspedes</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((rec: any) => (
              <div key={rec.id} className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{rec.name}</p>
                    {rec.is_hidden_gem && (
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3" /> Hidden Gem
                      </Badge>
                    )}
                    {!rec.is_active && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{rec.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="capitalize">{categories.find(c => c.value === rec.category)?.label || rec.category}</span>
                    {rec.price_range && <span>{rec.price_range}</span>}
                    {rec.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {rec.address}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(rec)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(rec.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {recommendations.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhuma recomendação cadastrada</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing || isAdding} onOpenChange={(open) => { if (!open) { setEditing(null); setIsAdding(false); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar" : "Nova"} Recomendação</DialogTitle>
          </DialogHeader>
          <RecommendationForm
            rec={editing || { name: "", category: "restaurant", is_active: true, is_hidden_gem: false }}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setIsAdding(false); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecommendationForm({ rec, onSave, onCancel }: { rec: any; onSave: (r: any) => void; onCancel: () => void }) {
  const [data, setData] = useState(rec);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nome (EN)</Label>
          <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Nome (PT)</Label>
          <Input value={data.name_pt || ""} onChange={(e) => setData({ ...data, name_pt: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição (EN)</Label>
        <Textarea value={data.description || ""} onChange={(e) => setData({ ...data, description: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label>Descrição (PT)</Label>
        <Textarea value={data.description_pt || ""} onChange={(e) => setData({ ...data, description_pt: e.target.value })} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={data.category} onValueChange={(v) => setData({ ...data, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Faixa de Preço</Label>
          <Select value={data.price_range || ""} onValueChange={(v) => setData({ ...data, price_range: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="$">$ - Econômico</SelectItem>
              <SelectItem value="$$">$$ - Moderado</SelectItem>
              <SelectItem value="$$$">$$$ - Alto</SelectItem>
              <SelectItem value="$$$$">$$$$ - Luxo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Endereço</Label>
        <Input value={data.address || ""} onChange={(e) => setData({ ...data, address: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label>Google Maps URL</Label>
        <Input value={data.google_maps_url || ""} onChange={(e) => setData({ ...data, google_maps_url: e.target.value })} placeholder="https://maps.google.com/..." />
      </div>

      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <Switch checked={data.is_hidden_gem} onCheckedChange={(v) => setData({ ...data, is_hidden_gem: v })} />
          <Label>Hidden Gem</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={data.is_active} onCheckedChange={(v) => setData({ ...data, is_active: v })} />
          <Label>Ativo</Label>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSave(data)}>Salvar</Button>
      </div>
    </div>
  );
}
