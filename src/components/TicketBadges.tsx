import { TicketStatus, TicketPriority } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles: Record<TicketStatus, string> = {
  new: 'bg-info/15 text-info border-info/30',
  open: 'bg-info/15 text-info border-info/30',
  in_progress: 'bg-warning/15 text-warning border-warning/30',
  waiting_on_customer: 'bg-accent/15 text-accent border-accent/30',
  resolved: 'bg-success/15 text-success border-success/30',
  closed: 'bg-muted text-muted-foreground border-border',
  reopened: 'bg-destructive/15 text-destructive border-destructive/30',
};

const priorityStyles: Record<TicketPriority, string> = {
  low: 'bg-muted text-muted-foreground border-border',
  medium: 'bg-info/15 text-info border-info/30',
  high: 'bg-warning/15 text-warning border-warning/30',
  urgent: 'bg-destructive/15 text-destructive border-destructive/30',
};

const statusLabels: Record<TicketStatus, string> = {
  new: 'جديدة',
  open: 'مفتوحة',
  in_progress: 'قيد المعالجة',
  waiting_on_customer: 'بانتظار العميل',
  resolved: 'تم الحل',
  closed: 'مغلقة',
  reopened: 'أُعيد فتحها',
};

const priorityLabels: Record<TicketPriority, string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', statusStyles[status])}>
      {statusLabels[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', priorityStyles[priority])}>
      {priorityLabels[priority]}
    </Badge>
  );
}
