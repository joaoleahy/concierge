import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  X,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

export type RequestStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "declined"
  | "modified"
  | "cancelled"
  | "accepted"
  | "rejected";

export type StatusFilter = "all" | "pending" | "in_progress" | "completed" | "declined" | "modified";

interface StatusConfigItem {
  icon: typeof Clock;
  color: string;
  bgColor: string;
}

export const statusConfig: Record<RequestStatus, StatusConfigItem> = {
  pending: {
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  in_progress: {
    icon: AlertCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  declined: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  modified: {
    icon: MessageSquare,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  cancelled: {
    icon: X,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  accepted: {
    icon: ThumbsUp,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  rejected: {
    icon: ThumbsDown,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
};

export const resolutionColors: Record<string, string> = {
  fulfilled: "text-green-600",
  cancelled_by_guest: "text-gray-600",
  declined_by_staff: "text-red-600",
  accepted_modified: "text-purple-600",
  rejected_modified: "text-orange-600",
};

export const terminalStatuses: RequestStatus[] = [
  "completed",
  "cancelled",
  "declined",
  "rejected",
];

export function isTerminalStatus(status: string): boolean {
  return terminalStatuses.includes(status as RequestStatus);
}

export function getStatusConfig(status: string): StatusConfigItem {
  return statusConfig[status as RequestStatus] || statusConfig.pending;
}
