import { Ticket } from '@/lib/api';
import { StatusBadge, PriorityBadge } from '@/components/TicketBadges';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { User } from 'lucide-react';

interface Props {
  ticket: Ticket;
  index: number;
  onClick: () => void;
}

export function TicketListItem({ ticket, index, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full text-right p-4 hover:bg-muted/50 transition-colors animate-fade-in"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono font-medium text-muted-foreground">{ticket.code || `#${ticket.ticket_number}`}</span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            {ticket.services && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{ticket.services.systems?.name} → {ticket.services.name}</span>
            )}
            {ticket.departments?.name && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{ticket.departments.name}</span>
            )}
          </div>
          <h3 className="font-semibold text-sm truncate">{ticket.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{ticket.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {ticket.requester?.full_name || 'غير معروف'}
          </span>
          {ticket.agent?.full_name && (
            <span>← {ticket.agent.full_name}</span>
          )}
        </div>
        <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: ar })}</span>
      </div>
    </button>
  );
}
