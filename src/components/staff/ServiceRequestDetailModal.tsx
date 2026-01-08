import { useState } from "react";
import { motion } from "framer-motion";
import { X, Clock, User, MessageSquare, Check, XCircle, Edit3, AlertCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR, es, enUS } from "date-fns/locale";
import { ServiceRequest } from "@/hooks/useRealtimeServiceRequests";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ServiceRequestDetailModalProps {
  request: ServiceRequest;
  language: string;
  onClose: () => void;
  onStatusChange: (request: ServiceRequest, status: string, staffResponse?: string) => Promise<void>;
}

const statusConfig: Record<string, { color: string; bgColor: string; label: Record<string, string> }> = {
  pending: { 
    color: "text-amber-700", 
    bgColor: "bg-amber-100",
    label: { en: "Pending", pt: "Pendente", es: "Pendiente" }
  },
  in_progress: { 
    color: "text-blue-700", 
    bgColor: "bg-blue-100",
    label: { en: "In Progress", pt: "Em Andamento", es: "En Progreso" }
  },
  completed: { 
    color: "text-green-700", 
    bgColor: "bg-green-100",
    label: { en: "Completed", pt: "Concluído", es: "Completado" }
  },
  declined: { 
    color: "text-red-700", 
    bgColor: "bg-red-100",
    label: { en: "Declined", pt: "Recusado", es: "Rechazado" }
  },
  modified: { 
    color: "text-purple-700", 
    bgColor: "bg-purple-100",
    label: { en: "Modified", pt: "Modificado", es: "Modificado" }
  },
};

type ActionMode = null | "decline" | "modify";

export function ServiceRequestDetailModal({
  request,
  language,
  onClose,
  onStatusChange,
}: ServiceRequestDetailModalProps) {
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [staffResponse, setStaffResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locale = language === "pt" ? ptBR : language === "es" ? es : enUS;
  const status = statusConfig[request.status] || statusConfig.pending;

  const timeAgo = formatDistanceToNow(new Date(request.created_at), { 
    addSuffix: true, 
    locale 
  });

  const handleAction = async (newStatus: string) => {
    if ((actionMode === "decline" || actionMode === "modify") && !staffResponse.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onStatusChange(request, newStatus, staffResponse || undefined);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const labels = {
    details: { en: "Details", pt: "Detalhes", es: "Detalles" },
    guestLanguage: { en: "Guest Language", pt: "Idioma do Hóspede", es: "Idioma del Huésped" },
    requestedAt: { en: "Requested at", pt: "Solicitado em", es: "Solicitado en" },
    start: { en: "Start", pt: "Iniciar", es: "Iniciar" },
    complete: { en: "Complete", pt: "Concluir", es: "Completar" },
    decline: { en: "Decline", pt: "Recusar", es: "Rechazar" },
    modify: { en: "Modify", pt: "Modificar", es: "Modificar" },
    confirm: { en: "Confirm", pt: "Confirmar", es: "Confirmar" },
    cancel: { en: "Cancel", pt: "Cancelar", es: "Cancelar" },
    declineReason: { en: "Reason for declining", pt: "Motivo da recusa", es: "Motivo del rechazo" },
    modifyMessage: { en: "Message to guest (e.g., alternative time)", pt: "Mensagem ao hóspede (ex: horário alternativo)", es: "Mensaje al huésped (ej: horario alternativo)" },
    staffResponse: { en: "Staff Response", pt: "Resposta da Equipe", es: "Respuesta del Personal" },
    noDetails: { en: "No additional details", pt: "Sem detalhes adicionais", es: "Sin detalles adicionales" },
  };

  const getLabel = (key: keyof typeof labels) => labels[key][language as "en" | "pt" | "es"] || labels[key].en;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="shadow-elevated overflow-hidden">
          <CardHeader className="relative pb-3">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <CardTitle className="text-xl">{request.request_type}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`${status.bgColor} ${status.color} border-0`}>
                    {status.label[language as "en" | "pt" | "es"] || status.label.en}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Request Details */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">{getLabel("details")}</p>
                  <p className="text-sm text-muted-foreground">
                    {request.details || getLabel("noDetails")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{getLabel("guestLanguage")}</p>
                    <p className="text-sm font-medium">
                      {request.guest_language?.toUpperCase() || "EN"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{getLabel("requestedAt")}</p>
                    <p className="text-sm font-medium">
                      {format(new Date(request.created_at), "HH:mm", { locale })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Staff Response (if exists) */}
              {request.staff_response && (
                <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">{getLabel("staffResponse")}</p>
                    <p className="text-sm">{request.staff_response}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Action Mode: Decline */}
            {actionMode === "decline" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3"
              >
                <Label htmlFor="decline-reason">{getLabel("declineReason")}</Label>
                <Textarea
                  id="decline-reason"
                  value={staffResponse}
                  onChange={(e) => setStaffResponse(e.target.value)}
                  placeholder={language === "pt" ? "Ex: Late checkout não disponível para esta data." : "Ex: Late checkout not available for this date."}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setActionMode(null);
                      setStaffResponse("");
                    }}
                  >
                    {getLabel("cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={!staffResponse.trim() || isSubmitting}
                    onClick={() => handleAction("declined")}
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        {getLabel("confirm")}
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Action Mode: Modify */}
            {actionMode === "modify" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3"
              >
                <Label htmlFor="modify-message">{getLabel("modifyMessage")}</Label>
                <Textarea
                  id="modify-message"
                  value={staffResponse}
                  onChange={(e) => setStaffResponse(e.target.value)}
                  placeholder={language === "pt" ? "Ex: Late checkout disponível até 13h. Confirma?" : "Ex: Late checkout available until 1 PM. Confirm?"}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setActionMode(null);
                      setStaffResponse("");
                    }}
                  >
                    {getLabel("cancel")}
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!staffResponse.trim() || isSubmitting}
                    onClick={() => handleAction("modified")}
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <>
                        <Edit3 className="h-4 w-4 mr-1" />
                        {getLabel("confirm")}
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Default Actions */}
            {actionMode === null && request.status === "pending" && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setActionMode("decline")}
                  className="text-destructive hover:text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  {getLabel("decline")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActionMode("modify")}
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  {getLabel("modify")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAction("in_progress")}
                  disabled={isSubmitting}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  {getLabel("start")}
                </Button>
                <Button
                  onClick={() => handleAction("completed")}
                  disabled={isSubmitting}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {getLabel("complete")}
                </Button>
              </div>
            )}

            {actionMode === null && request.status === "in_progress" && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setActionMode("decline")}
                  className="text-destructive hover:text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  {getLabel("decline")}
                </Button>
                <Button
                  onClick={() => handleAction("completed")}
                  disabled={isSubmitting}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {getLabel("complete")}
                </Button>
              </div>
            )}

            {request.status === "completed" && request.completed_at && (
              <div className="text-center py-2">
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                  <Check className="h-3 w-3 mr-1" />
                  {getLabel("complete")} {format(new Date(request.completed_at), "HH:mm", { locale })}
                </Badge>
              </div>
            )}

            {request.status === "declined" && (
              <div className="text-center py-2">
                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                  <XCircle className="h-3 w-3 mr-1" />
                  {statusConfig.declined.label[language as "en" | "pt" | "es"]}
                </Badge>
              </div>
            )}

            {request.status === "modified" && (
              <div className="text-center py-2">
                <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                  <Edit3 className="h-3 w-3 mr-1" />
                  {statusConfig.modified.label[language as "en" | "pt" | "es"]}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
