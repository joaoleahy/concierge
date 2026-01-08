import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ptBR, es, enUS } from "date-fns/locale";
import { useLanguage } from "@/hooks/useLanguage";
import { GuestRequest } from "@/hooks/useGuestRequests";
import { Clock, CheckCircle2, XCircle, AlertCircle, MessageSquare, X, Filter, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MyRequestsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  requests: GuestRequest[];
  isLoading: boolean;
}

type StatusFilter = "all" | "pending" | "in_progress" | "completed" | "declined" | "modified";

const statusConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  pending: { 
    icon: Clock, 
    color: "text-yellow-600", 
    bgColor: "bg-yellow-100" 
  },
  in_progress: { 
    icon: AlertCircle, 
    color: "text-blue-600", 
    bgColor: "bg-blue-100" 
  },
  completed: { 
    icon: CheckCircle2, 
    color: "text-green-600", 
    bgColor: "bg-green-100" 
  },
  declined: { 
    icon: XCircle, 
    color: "text-red-600", 
    bgColor: "bg-red-100" 
  },
  modified: { 
    icon: MessageSquare, 
    color: "text-purple-600", 
    bgColor: "bg-purple-100" 
  },
  cancelled: { 
    icon: X, 
    color: "text-gray-600", 
    bgColor: "bg-gray-100" 
  },
  accepted: { 
    icon: ThumbsUp, 
    color: "text-green-600", 
    bgColor: "bg-green-100" 
  },
  rejected: { 
    icon: ThumbsDown, 
    color: "text-red-600", 
    bgColor: "bg-red-100" 
  },
};

const resolutionConfig: Record<string, { label: Record<string, string>; color: string }> = {
  fulfilled: { 
    label: { en: "Fulfilled", pt: "Atendido", es: "Cumplido" },
    color: "text-green-600"
  },
  cancelled_by_guest: { 
    label: { en: "Cancelled by you", pt: "Cancelado por você", es: "Cancelado por ti" },
    color: "text-gray-600"
  },
  declined_by_staff: { 
    label: { en: "Declined by staff", pt: "Recusado pelo staff", es: "Rechazado por el personal" },
    color: "text-red-600"
  },
  accepted_modified: { 
    label: { en: "Accepted (modified)", pt: "Aceito (modificado)", es: "Aceptado (modificado)" },
    color: "text-purple-600"
  },
  rejected_modified: { 
    label: { en: "Rejected proposal", pt: "Proposta rejeitada", es: "Propuesta rechazada" },
    color: "text-orange-600"
  },
};

export function MyRequestsSheet({ isOpen, onClose, requests, isLoading }: MyRequestsSheetProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const getLocale = () => {
    switch (language) {
      case "pt": return ptBR;
      case "es": return es;
      default: return enUS;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, Record<string, string>> = {
      pending: { en: "Pending", pt: "Pendente", es: "Pendiente" },
      in_progress: { en: "In Progress", pt: "Em andamento", es: "En progreso" },
      completed: { en: "Completed", pt: "Concluído", es: "Completado" },
      declined: { en: "Declined", pt: "Recusado", es: "Rechazado" },
      modified: { en: "Awaiting Response", pt: "Aguardando resposta", es: "Esperando respuesta" },
      cancelled: { en: "Cancelled", pt: "Cancelado", es: "Cancelado" },
      accepted: { en: "Accepted", pt: "Aceito", es: "Aceptado" },
      rejected: { en: "Rejected", pt: "Rejeitado", es: "Rechazado" },
    };
    return labels[status]?.[language] || status;
  };

  const getFilterLabel = (filter: StatusFilter) => {
    const labels: Record<StatusFilter, Record<string, string>> = {
      all: { en: "All", pt: "Todos", es: "Todos" },
      pending: { en: "Pending", pt: "Pendente", es: "Pendiente" },
      in_progress: { en: "In Progress", pt: "Em andamento", es: "En progreso" },
      completed: { en: "Completed", pt: "Concluído", es: "Completado" },
      declined: { en: "Declined", pt: "Recusado", es: "Rechazado" },
      modified: { en: "Modified", pt: "Modificado", es: "Modificado" },
    };
    return labels[filter]?.[language] || filter;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "dd MMM, HH:mm", { locale: getLocale() });
  };

  const handleCancelRequest = async (requestId: string) => {
    setCancellingId(requestId);
    try {
      const { error } = await supabase
        .from("service_requests")
        .update({ status: "cancelled", resolution: "cancelled_by_guest" })
        .eq("id", requestId);

      if (error) throw error;

      const successMsg = {
        en: "Request cancelled successfully",
        pt: "Solicitação cancelada com sucesso",
        es: "Solicitud cancelada con éxito",
      };
      toast.success(successMsg[language as keyof typeof successMsg] || successMsg.en);
    } catch (error) {
      console.error("Error cancelling request:", error);
      const errorMsg = {
        en: "Failed to cancel request",
        pt: "Falha ao cancelar solicitação",
        es: "Error al cancelar solicitud",
      };
      toast.error(errorMsg[language as keyof typeof errorMsg] || errorMsg.en);
    } finally {
      setCancellingId(null);
      setConfirmCancelId(null);
    }
  };

  const handleRespondToModification = async (requestId: string, accept: boolean) => {
    setRespondingId(requestId);
    try {
      const updates = accept 
        ? { status: "in_progress", guest_accepted: true, resolution: "accepted_modified" }
        : { status: "rejected", guest_accepted: false, resolution: "rejected_modified" };

      const { error } = await supabase
        .from("service_requests")
        .update(updates)
        .eq("id", requestId);

      if (error) throw error;

      const successMsg = accept
        ? { en: "Proposal accepted!", pt: "Proposta aceita!", es: "¡Propuesta aceptada!" }
        : { en: "Proposal rejected", pt: "Proposta rejeitada", es: "Propuesta rechazada" };
      toast.success(successMsg[language as keyof typeof successMsg] || successMsg.en);
    } catch (error) {
      console.error("Error responding to modification:", error);
      const errorMsg = {
        en: "Failed to respond",
        pt: "Falha ao responder",
        es: "Error al responder",
      };
      toast.error(errorMsg[language as keyof typeof errorMsg] || errorMsg.en);
    } finally {
      setRespondingId(null);
    }
  };

  const getResolutionLabel = (resolution: string | null) => {
    if (!resolution) return null;
    const config = resolutionConfig[resolution];
    if (!config) return null;
    return config.label[language] || config.label.en;
  };

  const getResolutionColor = (resolution: string | null) => {
    if (!resolution) return "";
    return resolutionConfig[resolution]?.color || "";
  };

  const filteredRequests = requests.filter((request) => {
    if (statusFilter === "all") return true;
    return request.status === statusFilter;
  });

  const filterOptions: StatusFilter[] = ["all", "pending", "in_progress", "completed"];

  const getCancelLabel = () => {
    const labels = { en: "Cancel", pt: "Cancelar", es: "Cancelar" };
    return labels[language as keyof typeof labels] || labels.en;
  };

  const getCancelConfirmTitle = () => {
    const labels = { 
      en: "Cancel Request?", 
      pt: "Cancelar Solicitação?", 
      es: "¿Cancelar Solicitud?" 
    };
    return labels[language as keyof typeof labels] || labels.en;
  };

  const getCancelConfirmDesc = () => {
    const labels = { 
      en: "This action cannot be undone. The request will be cancelled.", 
      pt: "Esta ação não pode ser desfeita. A solicitação será cancelada.", 
      es: "Esta acción no se puede deshacer. La solicitud será cancelada." 
    };
    return labels[language as keyof typeof labels] || labels.en;
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader className="pb-2">
            <SheetTitle>{t("requests.myRequests")}</SheetTitle>
          </SheetHeader>

          {/* Status Filters */}
          <div className="flex items-center gap-2 pb-4 overflow-x-auto">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            {filterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  statusFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {getFilterLabel(filter)}
              </button>
            ))}
          </div>

          <ScrollArea className="h-[calc(85vh-130px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">{t("requests.noRequests")}</p>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {filteredRequests.map((request) => {
                  const config = statusConfig[request.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  const canCancel = request.status === "pending";
                  const canRespondToModification = request.status === "modified";
                  const resolutionLabel = getResolutionLabel((request as any).resolution);
                  const resolutionColor = getResolutionColor((request as any).resolution);
                  const isTerminalStatus = ["completed", "cancelled", "declined", "rejected"].includes(request.status);
                  
                  return (
                    <div 
                      key={request.id} 
                      className="rounded-xl border bg-card p-4 space-y-3"
                    >
                      {/* Header with Status and Resolution */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{request.request_type}</h4>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(request.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge 
                            variant="secondary"
                            className={cn(
                              "flex items-center gap-1 text-xs",
                              config.bgColor,
                              config.color
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {getStatusLabel(request.status)}
                          </Badge>
                          {isTerminalStatus && resolutionLabel && (
                            <span className={cn("text-xs font-medium", resolutionColor)}>
                              {resolutionLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      {request.details && (
                        <p className="text-sm text-muted-foreground">
                          {request.details}
                        </p>
                      )}

                      {/* Staff Response */}
                      {request.staff_response && (
                        <div className={cn(
                          "rounded-lg p-3 text-sm",
                          request.status === "declined" 
                            ? "bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-200"
                            : request.status === "modified"
                            ? "bg-purple-50 text-purple-800 dark:bg-purple-950/20 dark:text-purple-200"
                            : "bg-muted"
                        )}>
                          <p className="text-xs font-medium mb-1">
                            {request.status === "declined" 
                              ? t("requests.staffDeclined")
                              : request.status === "modified"
                              ? t("requests.staffModified")
                              : t("requests.staffResponse")
                            }
                          </p>
                          <p>{request.staff_response}</p>
                          {request.responded_at && (
                            <p className="text-xs opacity-70 mt-1">
                              {formatDate(request.responded_at)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Accept/Reject Buttons for Modified Requests */}
                      {canRespondToModification && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRespondToModification(request.id, true)}
                            disabled={respondingId === request.id}
                            className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                          >
                            {respondingId === request.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                {language === "pt" ? "Aceitar" : language === "es" ? "Aceptar" : "Accept"}
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRespondToModification(request.id, false)}
                            disabled={respondingId === request.id}
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            {respondingId === request.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                {language === "pt" ? "Recusar" : language === "es" ? "Rechazar" : "Reject"}
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Cancel Button for Pending Requests */}
                      {canCancel && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmCancelId(request.id)}
                          disabled={cancellingId === request.id}
                          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {cancellingId === request.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              {getCancelLabel()}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!confirmCancelId} onOpenChange={() => setConfirmCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getCancelConfirmTitle()}</AlertDialogTitle>
            <AlertDialogDescription>{getCancelConfirmDesc()}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "pt" ? "Voltar" : language === "es" ? "Volver" : "Go Back"}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmCancelId && handleCancelRequest(confirmCancelId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {getCancelLabel()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
