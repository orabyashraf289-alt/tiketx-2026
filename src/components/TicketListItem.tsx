import { Ticket } from '@/lib/api';
import { StatusBadge, PriorityBadge } from '@/components/TicketBadges';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { User, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  ticket: Ticket;
  index: number;
  onClick: () => void;
}

export function TicketListItem({ ticket, index, onClick }: Props) {
  const isOverdue = ticket.sla_resolution_due_at && !ticket.resolved_at && new Date(ticket.sla_resolution_due_at) < new Date();

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ backgroundColor: 'hsl(var(--muted) / 0.5)' }}
      className={`w-full text-right p-4 transition-all duration-200 ${isOverdue ? 'border-r-2 border-r-destructive' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {ticket.code || `#${ticket.ticket_number}`}
            </span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            {ticket.services && (
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {ticket.services.systems?.name} → {ticket.services.name}
              </span>
            )}
            {ticket.departments?.name && (
              <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                {ticket.departments.name}
              </span>
            )}
            {isOverdue && (
              <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full flex items-center gap-0.5 font-medium">
                <AlertTriangle className="h-2.5 w-2.5" />
                متأخرة
              </span>
            )}
          </div>
          <h3 className="font-semibold text-sm truncate text-foreground">{ticket.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{ticket.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {ticket.requester?.full_name || 'غير معروف'}
          </span>
          {ticket.agent?.full_name && (
            <span className="flex items-center gap-1 text-primary">
              ← {ticket.agent.full_name}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: ar })}
        </span>
      </div>
    </motion.button>
  );
}
