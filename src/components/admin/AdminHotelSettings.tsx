import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  tone_of_voice: string | null;
}

interface AdminHotelSettingsProps {
  hotel: Hotel | null;
}

export function AdminHotelSettings({ hotel }: AdminHotelSettingsProps) {
  const { t } = useTranslation();
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
    tone_of_voice: (hotel?.tone_of_voice || "relaxed_resort") as "relaxed_resort" | "formal_business" | "boutique_chic" | "family_friendly",
  });

  const handleSave = async () => {
    if (!hotel?.id) return;

    setSaving(true);
    try {
      await api.patch(`/api/admin/hotels/${hotel.id}`, formData);

      queryClient.invalidateQueries({ queryKey: ["hotel"] });
      toast.success(t("toast.saved"));
    } catch (error) {
      console.error("Error saving:", error);
      toast.error(t("toast.errors.save"));
    } finally {
      setSaving(false);
    }
  };

  if (!hotel) {
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
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.hotel.basicInfo")}</CardTitle>
          <CardDescription>{t("admin.hotel.basicInfoDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t("admin.hotel.form.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">{t("admin.hotel.form.city")}</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t("admin.hotel.form.country")}</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">{t("admin.hotel.form.whatsapp")}</Label>
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
          <CardTitle>{t("admin.hotel.guestInfo")}</CardTitle>
          <CardDescription>{t("admin.hotel.guestInfoDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wifi">{t("admin.hotel.form.wifiPassword")}</Label>
              <Input
                id="wifi"
                value={formData.wifi_password}
                onChange={(e) => setFormData({ ...formData, wifi_password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkout">{t("admin.hotel.form.checkoutTime")}</Label>
              <Input
                id="checkout"
                type="time"
                value={formData.checkout_time}
                onChange={(e) => setFormData({ ...formData, checkout_time: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="breakfast">{t("admin.hotel.form.breakfastHours")}</Label>
              <Input
                id="breakfast"
                placeholder={t("admin.hotel.form.breakfastPlaceholder")}
                value={formData.breakfast_hours}
                onChange={(e) => setFormData({ ...formData, breakfast_hours: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.hotel.customization")}</CardTitle>
          <CardDescription>{t("admin.hotel.customizationDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="tone">{t("admin.hotel.form.toneOfVoice")}</Label>
            <Select
              value={formData.tone_of_voice}
              onValueChange={(value: "relaxed_resort" | "formal_business" | "boutique_chic" | "family_friendly") => setFormData({ ...formData, tone_of_voice: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relaxed_resort">{t("admin.hotel.tones.relaxedResort")}</SelectItem>
                <SelectItem value="formal_business">{t("admin.hotel.tones.formalBusiness")}</SelectItem>
                <SelectItem value="boutique_chic">{t("admin.hotel.tones.boutiqueChic")}</SelectItem>
                <SelectItem value="family_friendly">{t("admin.hotel.tones.familyFriendly")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? t("common.saving") : t("common.saveChanges")}
        </Button>
      </div>
    </div>
  );
}
