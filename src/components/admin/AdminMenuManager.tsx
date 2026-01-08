import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface AdminMenuManagerProps {
  hotelId: string | null;
}

export function AdminMenuManager({ hotelId }: AdminMenuManagerProps) {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["menu-categories", hotelId],
    queryFn: async () => {
      if (!hotelId) return [];
      const { data, error } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!hotelId,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["menu-items", hotelId],
    queryFn: async () => {
      if (!hotelId) return [];
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!hotelId,
  });

  const handleSaveCategory = async (category: any) => {
    try {
      if (category.id) {
        const { error } = await supabase
          .from("menu_categories")
          .update({ name: category.name, name_pt: category.name_pt, icon: category.icon })
          .eq("id", category.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("menu_categories")
          .insert({ ...category, hotel_id: hotelId });
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
      setEditingCategory(null);
      setIsAddingCategory(false);
      toast.success("Categoria salva!");
    } catch (error) {
      toast.error("Erro ao salvar categoria");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Excluir esta categoria e todos os itens?")) return;
    try {
      const { error } = await supabase.from("menu_categories").delete().eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
      toast.success("Categoria excluída!");
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const handleSaveItem = async (item: any) => {
    try {
      if (item.id) {
        const { error } = await supabase
          .from("menu_items")
          .update({
            name: item.name,
            name_pt: item.name_pt,
            description: item.description,
            price: item.price,
            is_available: item.is_available,
            category_id: item.category_id,
          })
          .eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("menu_items")
          .insert({ ...item, hotel_id: hotelId });
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      setEditingItem(null);
      setIsAddingItem(false);
      toast.success("Item salvo!");
    } catch (error) {
      toast.error("Erro ao salvar item");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Excluir este item?")) return;
    try {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success("Item excluído!");
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
      {/* Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Categorias do Menu</CardTitle>
            <CardDescription>Organize os itens do menu por categorias</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAddingCategory(true)}>
            <Plus className="h-4 w-4 mr-1" /> Categoria
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories.map((cat: any) => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{cat.name}</p>
                  {cat.name_pt && <p className="text-sm text-muted-foreground">{cat.name_pt}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditingCategory(cat)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Nenhuma categoria criada</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Itens do Menu</CardTitle>
            <CardDescription>Pratos e bebidas disponíveis</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAddingItem(true)} disabled={categories.length === 0}>
            <Plus className="h-4 w-4 mr-1" /> Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.name}</p>
                    {!item.is_available && (
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                        Indisponível
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    R$ {item.price?.toFixed(2)} • {categories.find((c: any) => c.id === item.category_id)?.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Nenhum item criado</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <Dialog open={!!editingCategory || isAddingCategory} onOpenChange={(open) => { if (!open) { setEditingCategory(null); setIsAddingCategory(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory?.id ? "Editar" : "Nova"} Categoria</DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={editingCategory || { name: "", name_pt: "", icon: "utensils" }}
            onSave={handleSaveCategory}
            onCancel={() => { setEditingCategory(null); setIsAddingCategory(false); }}
          />
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={!!editingItem || isAddingItem} onOpenChange={(open) => { if (!open) { setEditingItem(null); setIsAddingItem(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? "Editar" : "Novo"} Item</DialogTitle>
          </DialogHeader>
          <ItemForm
            item={editingItem || { name: "", name_pt: "", description: "", price: 0, is_available: true, category_id: categories[0]?.id }}
            categories={categories}
            onSave={handleSaveItem}
            onCancel={() => { setEditingItem(null); setIsAddingItem(false); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryForm({ category, onSave, onCancel }: { category: any; onSave: (c: any) => void; onCancel: () => void }) {
  const [data, setData] = useState(category);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome (EN)</Label>
        <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Nome (PT)</Label>
        <Input value={data.name_pt || ""} onChange={(e) => setData({ ...data, name_pt: e.target.value })} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSave(data)}>Salvar</Button>
      </div>
    </div>
  );
}

function ItemForm({ item, categories, onSave, onCancel }: { item: any; categories: any[]; onSave: (i: any) => void; onCancel: () => void }) {
  const [data, setData] = useState(item);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome (EN)</Label>
        <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Nome (PT)</Label>
        <Input value={data.name_pt || ""} onChange={(e) => setData({ ...data, name_pt: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input value={data.description || ""} onChange={(e) => setData({ ...data, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Preço (R$)</Label>
          <Input type="number" step="0.01" value={data.price} onChange={(e) => setData({ ...data, price: parseFloat(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={data.category_id} onValueChange={(v) => setData({ ...data, category_id: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={data.is_available} onCheckedChange={(v) => setData({ ...data, is_available: v })} />
        <Label>Disponível</Label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSave(data)}>Salvar</Button>
      </div>
    </div>
  );
}
