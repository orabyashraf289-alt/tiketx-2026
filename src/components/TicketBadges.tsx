import { TicketStatus, TicketPriority } from "@/types/ticket";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<TicketStatus, string> = {
  open: "bg-info/15 text-info border-info/30",
  in_progress: "bg-warning/15 text-warning border-warning/30",
  resolved: "bg-success/15 text-success border-success/30",
  closed: "bg-muted text-muted-foreground border-border",
};

const priorityStyles: Record<TicketPriority, string> = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-info/15 text-info border-info/30",
  high: "bg-warning/15 text-warning border-warning/30",
  urgent: "bg-destructive/15 text-destructive border-destructive/30",
};

const statusLabels: Record<TicketStatus, string> = {
  open: "مفتوحة",
  in_progress: "قيد المعالجة",
  resolved: "تم الحل",
  closed: "مغلقة",
};

const priorityLabels: Record<TicketPriority, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  urgent: "عاجلة",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", statusStyles[status])}>
      {statusLabels[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", priorityStyles[priority])}>
      {priorityLabels[priority]}
    </Badge>
  );
}
