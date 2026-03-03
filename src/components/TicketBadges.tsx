import { TicketStatus, TicketPriority } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Clock, ShieldAlert, ShieldCheck } from 'lucide-react';

const statusStyles: Record<TicketStatus, string> = {
  new: 'bg-info/15 text-info border-info/30',
  open: 'bg-primary/15 text-primary border-primary/30',
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

// SLA Badge matching reference design
type SLAStatus = 'achieved' | 'breached' | 'on_track' | 'at_risk';

export function SLABadge({ slaResolutionDueAt, resolvedAt }: { slaResolutionDueAt: string | null; resolvedAt: string | null }) {
  if (!slaResolutionDueAt) return <span className="text-xs text-muted-foreground">—</span>;
  
  const dueDate = new Date(slaResolutionDueAt);
  const now = new Date();
  
  let status: SLAStatus;
  if (resolvedAt) {
    const resolved = new Date(resolvedAt);
    status = resolved <= dueDate ? 'achieved' : 'breached';
  } else {
    const timeLeft = dueDate.getTime() - now.getTime();
    const totalTime = dueDate.getTime() - (dueDate.getTime() - 24 * 60 * 60 * 1000); // rough estimate
    if (timeLeft < 0) {
      status = 'breached';
    } else if (timeLeft < 2 * 60 * 60 * 1000) { // less than 2 hours
      status = 'at_risk';
    } else {
      status = 'on_track';
    }
  }

  const config: Record<SLAStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
    achieved: { label: 'ضمن SLA', icon: ShieldCheck, className: 'bg-success/15 text-success border-success/30' },
    breached: { label: 'تجاوز SLA', icon: ShieldAlert, className: 'bg-destructive/15 text-destructive border-destructive/30' },
    on_track: { label: 'في الموعد', icon: Clock, className: 'bg-info/15 text-info border-info/30' },
    at_risk: { label: 'معرّض', icon: AlertTriangle, className: 'bg-warning/15 text-warning border-warning/30' },
  };

  const { label, icon: Icon, className } = config[status];
  
  return (
    <Badge variant="outline" className={cn('text-[10px] font-semibold gap-1', className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
