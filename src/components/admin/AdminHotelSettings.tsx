import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
  whatsapp_number: string;
  wifi_password: string | null;
  checkout_time: string | null;
  breakfast_hours: string | null;
  accent_color: string | null;
  tone_of_voice: string | null;
}

interface AdminHotelSettingsProps {
  hotel: Hotel | null;
}

export function AdminHotelSettings({ hotel }: AdminHotelSettingsProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: hotel?.name || "",
    city: hotel?.city || "",
    country: hotel?.country || "",
    whatsapp_number: hotel?.whatsapp_number || "",
    wifi_password: hotel?.wifi_password || "",
    checkout_time: hotel?.checkout_time || "12:00",
    breakfast_hours: hotel?.breakfast_hours || "",
    accent_color: hotel?.accent_color || "#1e3a5f",
    tone_of_voice: (hotel?.tone_of_voice || "relaxed_resort") as "relaxed_resort" | "formal_business" | "boutique_chic" | "family_friendly",
  });

  const handleSave = async () => {
    if (!hotel?.id) return;
    
    setSaving(true);
    try {
      await api.patch(`/api/admin/hotels/${hotel.id}`, formData);

      queryClient.invalidateQueries({ queryKey: ["hotel"] });
      toast.success("Configurações salvas!");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (!hotel) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum hotel encontrado
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Configure as informações principais do hotel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Hotel</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações para Hóspedes</CardTitle>
          <CardDescription>Dados exibidos no app do hóspede</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wifi">Senha do Wi-Fi</Label>
              <Input
                id="wifi"
                value={formData.wifi_password}
                onChange={(e) => setFormData({ ...formData, wifi_password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkout">Horário de Check-out</Label>
              <Input
                id="checkout"
                type="time"
                value={formData.checkout_time}
                onChange={(e) => setFormData({ ...formData, checkout_time: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="breakfast">Horário do Café da Manhã</Label>
              <Input
                id="breakfast"
                placeholder="Ex: 07:00 - 10:00"
                value={formData.breakfast_hours}
                onChange={(e) => setFormData({ ...formData, breakfast_hours: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personalização</CardTitle>
          <CardDescription>Aparência e tom do concierge virtual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="color">Cor Principal</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  className="w-12 h-10 p-1"
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                />
                <Input
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Tom de Voz do Concierge</Label>
              <Select
                value={formData.tone_of_voice}
                onValueChange={(value: "relaxed_resort" | "formal_business" | "boutique_chic" | "family_friendly") => setFormData({ ...formData, tone_of_voice: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relaxed_resort">Resort Relaxado</SelectItem>
                  <SelectItem value="formal_business">Formal / Executivo</SelectItem>
                  <SelectItem value="boutique_chic">Boutique Chique</SelectItem>
                  <SelectItem value="family_friendly">Familiar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}
