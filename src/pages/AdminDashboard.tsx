import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Hotel, UtensilsCrossed, MapPin, DoorOpen, LogOut, Users, Settings } from "lucide-react";
import { useUserHotel } from "@/hooks/useUserHotel";
import { useHotelById } from "@/hooks/useHotel";
import { useAuth, useProfile } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { AdminHotelSettings } from "@/components/admin/AdminHotelSettings";
import { AdminMenuManager } from "@/components/admin/AdminMenuManager";
import { AdminRecommendations } from "@/components/admin/AdminRecommendations";
import { AdminRooms } from "@/components/admin/AdminRooms";
import { AdminStaffManager } from "@/components/admin/AdminStaffManager";
import { AdminServiceTypes } from "@/components/admin/AdminServiceTypes";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("hotel");

  // Get hotel from user's roles
  const { hotelId, hotel, isAdmin, loading: userHotelLoading, user } = useUserHotel();
  const { data: hotelData, isLoading: hotelLoading } = useHotelById(hotelId);
  const { signOut } = useAuth();
  const { profile } = useProfile(user?.id);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!userHotelLoading) {
      if (!user) {
        navigate("/login?redirect=/admin");
      } else if (!isAdmin) {
        navigate("/unauthorized");
      }
    }
  }, [user, isAdmin, userHotelLoading, navigate]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      navigate("/login");
    }
  };

  if (userHotelLoading || hotelLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const displayHotel = hotelData || hotel;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{displayHotel?.name || "Configurar Hotel"}</h1>
              <p className="text-sm text-muted-foreground">Painel Administrativo</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {profile?.display_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-muted-foreground">
                  {profile?.display_name || user?.email}
                </span>
              </div>
              <LanguageSelector />
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="hotel" className="gap-2">
              <Hotel className="h-4 w-4" />
              <span className="hidden sm:inline">Hotel</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Serviços</span>
            </TabsTrigger>
            <TabsTrigger value="menu" className="gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              <span className="hidden sm:inline">Menu</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Locais</span>
            </TabsTrigger>
            <TabsTrigger value="rooms" className="gap-2">
              <DoorOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Quartos</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Equipe</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hotel">
            <AdminHotelSettings hotel={hotelData || null} />
          </TabsContent>

          <TabsContent value="services">
            {hotelId && <AdminServiceTypes hotelId={hotelId} />}
          </TabsContent>

          <TabsContent value="menu">
            <AdminMenuManager hotelId={hotelId} />
          </TabsContent>

          <TabsContent value="recommendations">
            <AdminRecommendations hotelId={hotelId} />
          </TabsContent>

          <TabsContent value="rooms">
            <AdminRooms hotelId={hotelId} hotelWhatsapp={hotelData?.whatsapp_number || null} />
          </TabsContent>

          <TabsContent value="team">
            {hotelId && <AdminStaffManager hotelId={hotelId} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
