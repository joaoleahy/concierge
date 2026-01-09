import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api/client";
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
  const { t } = useTranslation();
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
      const data = await api.get<any[]>(`/api/admin/menu/categories?hotelId=${hotelId}`);
      return data;
    },
    enabled: !!hotelId,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["menu-items", hotelId],
    queryFn: async () => {
      if (!hotelId) return [];
      const data = await api.get<any[]>(`/api/admin/menu/items?hotelId=${hotelId}`);
      return data;
    },
    enabled: !!hotelId,
  });

  const handleSaveCategory = async (category: any) => {
    try {
      if (category.id) {
        await api.patch(`/api/admin/menu/categories/${category.id}`, {
          name: category.name,
          namePt: category.name_pt,
          icon: category.icon,
        });
      } else {
        await api.post("/api/admin/menu/categories", { ...category, hotelId });
      }
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
      setEditingCategory(null);
      setIsAddingCategory(false);
      toast.success(t("toast.saved"));
    } catch (error) {
      toast.error(t("toast.errors.save"));
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(t("confirm.deleteCategory"))) return;
    try {
      await api.delete(`/api/admin/menu/categories/${id}`);
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
      toast.success(t("toast.deleted"));
    } catch (error) {
      toast.error(t("toast.errors.delete"));
    }
  };

  const handleSaveItem = async (item: any) => {
    try {
      if (item.id) {
        await api.patch(`/api/admin/menu/items/${item.id}`, {
          name: item.name,
          namePt: item.name_pt,
          description: item.description,
          price: item.price,
          isAvailable: item.is_available,
          categoryId: item.category_id,
        });
      } else {
        await api.post("/api/admin/menu/items", { ...item, hotelId });
      }
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      setEditingItem(null);
      setIsAddingItem(false);
      toast.success(t("toast.saved"));
    } catch (error) {
      toast.error(t("toast.errors.save"));
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm(t("confirm.deleteItem"))) return;
    try {
      await api.delete(`/api/admin/menu/items/${id}`);
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success(t("toast.deleted"));
    } catch (error) {
      toast.error(t("toast.errors.delete"));
    }
  };

  if (!hotelId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t("admin.hotel.noHotel")}
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
            <CardTitle>{t("admin.menu.categories")}</CardTitle>
            <CardDescription>{t("admin.menu.categoriesDesc")}</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAddingCategory(true)}>
            <Plus className="h-4 w-4 mr-1" /> {t("admin.menu.addCategory")}
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
              <p className="text-center text-muted-foreground py-4">{t("admin.menu.noCategories")}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("admin.menu.items")}</CardTitle>
            <CardDescription>{t("admin.menu.itemsDesc")}</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAddingItem(true)} disabled={categories.length === 0}>
            <Plus className="h-4 w-4 mr-1" /> {t("admin.menu.addItem")}
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
                        {t("admin.menu.unavailable")}
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
              <p className="text-center text-muted-foreground py-4">{t("admin.menu.noItems")}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <Dialog open={!!editingCategory || isAddingCategory} onOpenChange={(open) => { if (!open) { setEditingCategory(null); setIsAddingCategory(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory?.id ? t("common.edit") : t("common.new")} {t("admin.menu.addCategory")}</DialogTitle>
          </DialogHeader>
          <CategoryForm
            t={t}
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
            <DialogTitle>{editingItem?.id ? t("common.edit") : t("common.new")} {t("admin.menu.addItem")}</DialogTitle>
          </DialogHeader>
          <ItemForm
            t={t}
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

function CategoryForm({ category, onSave, onCancel, t }: { category: any; onSave: (c: any) => void; onCancel: () => void; t: (key: string) => string }) {
  const [data, setData] = useState(category);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("admin.services.form.nameEN")}</Label>
        <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>{t("admin.services.form.namePT")}</Label>
        <Input value={data.name_pt || ""} onChange={(e) => setData({ ...data, name_pt: e.target.value })} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>{t("common.cancel")}</Button>
        <Button onClick={() => onSave(data)}>{t("common.save")}</Button>
      </div>
    </div>
  );
}

function ItemForm({ item, categories, onSave, onCancel, t }: { item: any; categories: any[]; onSave: (i: any) => void; onCancel: () => void; t: (key: string) => string }) {
  const [data, setData] = useState(item);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("admin.services.form.nameEN")}</Label>
        <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>{t("admin.services.form.namePT")}</Label>
        <Input value={data.name_pt || ""} onChange={(e) => setData({ ...data, name_pt: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>{t("admin.services.form.description")}</Label>
        <Input value={data.description || ""} onChange={(e) => setData({ ...data, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("admin.menu.form.price")}</Label>
          <Input type="number" step="0.01" value={data.price} onChange={(e) => setData({ ...data, price: parseFloat(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>{t("admin.menu.form.category")}</Label>
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
        <Label>{t("admin.menu.form.available")}</Label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>{t("common.cancel")}</Button>
        <Button onClick={() => onSave(data)}>{t("common.save")}</Button>
      </div>
    </div>
  );
}
