import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  ContentStatus,
  HospitalWorkspace,
  RequestStatus
} from "@/services/request.service";

type Status =
  | RequestStatus
  | HospitalWorkspace["status"]
  | ContentStatus;

const statusStyles: Record<Status, string> = {
  NEW: "border-blue-500/30 bg-blue-500/15 text-blue-300",
  REVIEWING: "border-slate-500/30 bg-slate-500/15 text-slate-300",
  APPROVED: "border-green-500/30 bg-green-500/15 text-green-300",
  SETUP: "border-orange-500/30 bg-orange-500/15 text-orange-300",
  LIVE: "border-cyan-500/30 bg-cyan-500/15 text-cyan-300",
  CREATING: "border-blue-500/30 bg-blue-500/15 text-blue-300",
  ACTIVE: "border-green-500/30 bg-green-500/15 text-green-300",
  PAUSED: "border-orange-500/30 bg-orange-500/15 text-orange-300",
  DRAFT: "border-slate-500/30 bg-slate-500/15 text-slate-300",
  PUBLISHED: "border-cyan-500/30 bg-cyan-500/15 text-cyan-300"
};

type StatusBadgeProps = {
  status: Status;
};

export function StatusBadge({
  status
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 rounded-full px-3 text-xs font-semibold",
        statusStyles[status]
      )}
    >
      {status}
    </Badge>
  );
}
