import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ptBR, es, enUS, Locale } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GuestRequest } from "@/hooks/useGuestRequests";
import {
  getStatusConfig,
  isTerminalStatus,
  resolutionColors,
} from "@/lib/request-status";

interface RequestCardProps {
  request: GuestRequest & { resolution?: string | null };
  language: string;
  onCancel: (id: string) => void;
  onAcceptModification: (id: string) => void;
  onRejectModification: (id: string) => void;
  isCancelling: boolean;
  isResponding: boolean;
}

const localeMap: Record<string, Locale> = {
  pt: ptBR,
  es: es,
  en: enUS,
};

export function RequestCard({
  request,
  language,
  onCancel,
  onAcceptModification,
  onRejectModification,
  isCancelling,
  isResponding,
}: RequestCardProps) {
  const { t } = useTranslation();
  const locale = localeMap[language] || enUS;
  const config = getStatusConfig(request.status);
  const StatusIcon = config.icon;

  const canCancel = request.status === "pending";
  const canRespondToModification = request.status === "modified";
  const showResolution = isTerminalStatus(request.status) && request.resolution;

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "";
      return format(date, "dd MMM, HH:mm", { locale });
    } catch {
      return "";
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
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
            {t(`status.${request.status}`)}
          </Badge>
          {showResolution && (
            <span
              className={cn(
                "text-xs font-medium",
                resolutionColors[request.resolution!] || ""
              )}
            >
              {t(`resolution.${request.resolution}`)}
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      {request.details && (
        <p className="text-sm text-muted-foreground">{request.details}</p>
      )}

      {/* Staff Response */}
      {request.staff_response && (
        <div
          className={cn(
            "rounded-lg p-3 text-sm",
            request.status === "declined"
              ? "bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-200"
              : request.status === "modified"
              ? "bg-purple-50 text-purple-800 dark:bg-purple-950/20 dark:text-purple-200"
              : "bg-muted"
          )}
        >
          <p className="text-xs font-medium mb-1">
            {request.status === "declined"
              ? t("requests.staffDeclined")
              : request.status === "modified"
              ? t("requests.staffModified")
              : t("requests.staffResponse")}
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
            onClick={() => onAcceptModification(request.id)}
            disabled={isResponding}
            className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
          >
            {isResponding ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t("requests.accept")}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRejectModification(request.id)}
            disabled={isResponding}
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            {isResponding ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                {t("requests.reject")}
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
          onClick={() => onCancel(request.id)}
          disabled={isCancelling}
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          {isCancelling ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              <X className="h-4 w-4 mr-2" />
              {t("common.cancel")}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
