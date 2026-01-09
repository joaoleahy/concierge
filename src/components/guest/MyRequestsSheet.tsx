import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { useLanguage } from "@/hooks/useLanguage";
import { GuestRequest } from "@/hooks/useGuestRequests";
import { Clock, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { RequestCard } from "./requests/RequestCard";
import { StatusFilter } from "@/lib/request-status";

interface MyRequestsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  requests: GuestRequest[];
  isLoading: boolean;
}

const filterOptions: StatusFilter[] = ["all", "pending", "in_progress", "completed"];

export function MyRequestsSheet({ isOpen, onClose, requests, isLoading }: MyRequestsSheetProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const handleCancelRequest = async (requestId: string) => {
    setCancellingId(requestId);
    try {
      await api.patch(`/api/services/requests/${requestId}`, {
        status: "cancelled",
        resolution: "cancelled_by_guest",
      });
      toast.success(t("requests.cancelRequest"));
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error(t("staff.updateError"));
    } finally {
      setCancellingId(null);
      setConfirmCancelId(null);
    }
  };

  const handleRespondToModification = async (requestId: string, accept: boolean) => {
    setRespondingId(requestId);
    try {
      const updates = accept
        ? { status: "in_progress", guestAccepted: true, resolution: "accepted_modified" }
        : { status: "rejected", guestAccepted: false, resolution: "rejected_modified" };

      await api.patch(`/api/services/requests/${requestId}`, updates);
      toast.success(accept ? t("requests.acceptProposal") : t("requests.rejectProposal"));
    } catch (error) {
      console.error("Error responding to modification:", error);
      toast.error(t("staff.updateError"));
    } finally {
      setRespondingId(null);
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (statusFilter === "all") return true;
    return request.status === statusFilter;
  });

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
                {t(`status.${filter}`)}
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
                {filteredRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request as GuestRequest & { resolution?: string | null }}
                    language={language}
                    onCancel={() => setConfirmCancelId(request.id)}
                    onAcceptModification={() => handleRespondToModification(request.id, true)}
                    onRejectModification={() => handleRespondToModification(request.id, false)}
                    isCancelling={cancellingId === request.id}
                    isResponding={respondingId === request.id}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!confirmCancelId} onOpenChange={() => setConfirmCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("requests.cancelRequest")}?</AlertDialogTitle>
            <AlertDialogDescription>{t("requests.confirmCancel")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.close")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmCancelId && handleCancelRequest(confirmCancelId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.cancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
