import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Clock, RefreshCw, Volume2, VolumeX, LogOut, XCircle, Edit3 } from "lucide-react";
import { format, formatDistanceToNow, Locale } from "date-fns";
import { ptBR, es, enUS } from "date-fns/locale";
import { useUserHotel } from "@/hooks/useUserHotel";
import { useHotelById } from "@/hooks/useHotel";
import { useServiceRequests, useRealtimeServiceRequests, useUpdateServiceRequest, ServiceRequest } from "@/hooks/useRealtimeServiceRequests";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ServiceRequestDetailModal } from "@/components/staff/ServiceRequestDetailModal";

const statusColors: Record<string, string> = {
  pending: "bg-amber-500",
  in_progress: "bg-blue-500",
  completed: "bg-green-500",
  declined: "bg-red-500",
  modified: "bg-purple-500",
};

const statusLabels: Record<string, Record<string, string>> = {
  pending: { en: "Pending", pt: "Pendente", es: "Pendiente" },
  in_progress: { en: "In Progress", pt: "Em Andamento", es: "En Progreso" },
  completed: { en: "Completed", pt: "Concluído", es: "Completado" },
  declined: { en: "Declined", pt: "Recusado", es: "Rechazado" },
  modified: { en: "Modified", pt: "Modificado", es: "Modificado" },
};

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { signOut } = useAuth();
  
  // Get hotel from user's roles
  const { hotelId, hotel, isStaff, loading: userHotelLoading, user } = useUserHotel();
  const { data: hotelData, isLoading: hotelLoading } = useHotelById(hotelId);
  
  const [activeTab, setActiveTab] = useState("pending");
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("staff-sound-enabled");
    return saved !== null ? saved === "true" : true;
  });
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  
  const { data: requests = [], isLoading: requestsLoading, refetch } = useServiceRequests(hotelId);
  const { newRequestCount, resetNewRequestCount } = useRealtimeServiceRequests(hotelId, soundEnabled);
  const { updateStatus } = useUpdateServiceRequest();

  // Redirect if not authenticated or not staff
  useEffect(() => {
    if (!userHotelLoading) {
      if (!user) {
        navigate("/login?redirect=/staff");
      } else if (!isStaff) {
        navigate("/unauthorized");
      }
    }
  }, [user, isStaff, userHotelLoading, navigate]);

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem("staff-sound-enabled", String(enabled));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const locale = language === "pt" ? ptBR : language === "es" ? es : enUS;

  // Reset new request count when viewing pending tab
  useEffect(() => {
    if (activeTab === "pending") {
      resetNewRequestCount();
    }
  }, [activeTab, resetNewRequestCount]);

  const filteredRequests = requests.filter((req) => {
    if (activeTab === "pending") return req.status === "pending";
    if (activeTab === "in_progress") return req.status === "in_progress";
    if (activeTab === "completed") return ["completed", "declined", "modified"].includes(req.status);
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const inProgressCount = requests.filter((r) => r.status === "in_progress").length;

  const handleStatusChange = async (request: ServiceRequest, newStatus: string, staffResponse?: string) => {
    try {
      await updateStatus(request.id, request.hotel_id, newStatus, staffResponse);
      toast.success(
        language === "pt" 
          ? "Status atualizado!" 
          : language === "es" 
            ? "¡Estado actualizado!" 
            : "Status updated!"
      );
    } catch (error) {
      toast.error(
        language === "pt" 
          ? "Erro ao atualizar status" 
          : language === "es" 
            ? "Error al actualizar estado" 
            : "Failed to update status"
      );
    }
  };

  if (userHotelLoading || hotelLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !isStaff) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{hotelData?.name || hotel?.name}</h1>
              <p className="text-sm text-muted-foreground">
                {language === "pt" ? "Painel de Solicitações" : language === "es" ? "Panel de Solicitudes" : "Service Requests"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={handleSoundToggle}
                  aria-label={language === "pt" ? "Som de notificação" : language === "es" ? "Sonido de notificación" : "Notification sound"}
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <div className="relative">
                <Bell className="h-5 w-5" />
                {newRequestCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                    {newRequestCount}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">
                {language === "pt" ? "Pendentes" : language === "es" ? "Pendientes" : "Pending"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
              <p className="text-xs text-muted-foreground">
                {language === "pt" ? "Em Andamento" : language === "es" ? "En Progreso" : "In Progress"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{requests.length}</p>
              <p className="text-xs text-muted-foreground">
                {language === "pt" ? "Total Hoje" : language === "es" ? "Total Hoy" : "Today"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pending" className="relative">
              {language === "pt" ? "Pendentes" : language === "es" ? "Pendientes" : "Pending"}
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              {language === "pt" ? "Em Andamento" : language === "es" ? "En Progreso" : "In Progress"}
            </TabsTrigger>
            <TabsTrigger value="completed">
              {language === "pt" ? "Finalizados" : language === "es" ? "Finalizados" : "Finished"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {requestsLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {language === "pt" 
                    ? "Nenhuma solicitação nesta categoria" 
                    : language === "es" 
                      ? "No hay solicitudes en esta categoría" 
                      : "No requests in this category"}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredRequests.map((request, index) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      index={index}
                      language={language}
                      locale={locale}
                      onViewDetails={() => setSelectedRequest(request)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <ServiceRequestDetailModal
            request={selectedRequest}
            language={language}
            onClose={() => setSelectedRequest(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface RequestCardProps {
  request: ServiceRequest;
  index: number;
  language: string;
  locale: Locale;
  onViewDetails: () => void;
}

function RequestCard({ request, index, language, locale, onViewDetails }: Omit<RequestCardProps, "onStatusChange">) {
  const timeAgo = formatDistanceToNow(new Date(request.created_at), { 
    addSuffix: true, 
    locale 
  });

  const getStatusIcon = () => {
    switch (request.status) {
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "in_progress":
        return <RefreshCw className="h-3 w-3" />;
      case "declined":
        return <XCircle className="h-3 w-3" />;
      case "modified":
        return <Edit3 className="h-3 w-3" />;
      case "completed":
        return <Check className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <Card 
        className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
        onClick={onViewDetails}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusColors[request.status] || statusColors.pending}`} />
              <h3 className="font-medium truncate">{request.request_type}</h3>
            </div>
            <Badge 
              variant="outline" 
              className={`text-xs flex items-center gap-1 shrink-0 ml-2 ${
                request.status === "pending" ? "border-amber-500 text-amber-600" :
                request.status === "in_progress" ? "border-blue-500 text-blue-600" :
                request.status === "completed" ? "border-green-500 text-green-600" :
                request.status === "declined" ? "border-red-500 text-red-600" :
                request.status === "modified" ? "border-purple-500 text-purple-600" : ""
              }`}
            >
              {getStatusIcon()}
              {statusLabels[request.status]?.[language] || request.status}
            </Badge>
          </div>

          {request.details && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {request.details}
            </p>
          )}

          {request.staff_response && (
            <div className="text-sm p-2 bg-muted/50 rounded-md mb-2 border-l-2 border-primary">
              <p className="line-clamp-2 text-muted-foreground">{request.staff_response}</p>
            </div>
          )}
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
            {request.guest_language && (
              <span className="flex items-center gap-1 uppercase font-medium">
                {request.guest_language}
              </span>
            )}
            {request.completed_at && (
              <span className="ml-auto">
                {format(new Date(request.completed_at), "HH:mm", { locale })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
