import { memo, forwardRef } from 'react';
import { Ticket } from '@/lib/api';
import { StatusBadge, PriorityBadge, SLABadge } from '@/components/TicketBadges';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { User, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/i18n';

interface Props {
  ticket: Ticket;
  index: number;
  onClick: () => void;
}

export const TicketListItem = memo(forwardRef<HTMLButtonElement, Props>(function TicketListItem({ ticket, index, onClick }, ref) {
  const { t, lang, isRTL } = useLanguage();
  const isOverdue = ticket.sla_resolution_due_at && !ticket.resolved_at && new Date(ticket.sla_resolution_due_at) < new Date();
  const dateLocale = lang === 'ar' ? ar : enUS;

  const AssignArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`group w-full text-start px-3 sm:px-4 py-3 transition-all duration-300 hover:bg-primary/5 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset relative overflow-hidden ${
        isOverdue ? 'ltr:border-l-2 ltr:border-l-destructive rtl:border-r-2 rtl:border-r-destructive bg-destructive/5' : ''
      }`}
      aria-label={`${t.tickets.code} ${ticket.code || ticket.ticket_number}: ${ticket.title}`}
    >
      {/* Hover gradient line */}
      <div className="absolute top-0 ltr:left-0 rtl:right-0 w-0 h-full bg-gradient-to-b from-primary/10 via-accent/5 to-transparent group-hover:w-1 transition-all duration-300" />
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] sm:text-xs font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {ticket.code || `#${ticket.ticket_number}`}
            </span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span className="hidden sm:inline-flex"><SLABadge slaResolutionDueAt={ticket.sla_resolution_due_at} resolvedAt={ticket.resolved_at} /></span>
            {ticket.services && (
              <span className="hidden md:inline-flex text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {ticket.services.systems?.name} → {ticket.services.name}
              </span>
            )}
            {ticket.departments?.name && (
              <span className="hidden lg:inline-flex text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                {ticket.departments.name}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-xs sm:text-sm truncate text-foreground">{ticket.title}</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-1 hidden sm:block">{ticket.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 sm:mt-2.5 text-[10px] sm:text-xs text-muted-foreground">
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[80px] sm:max-w-none">{ticket.requester?.full_name || t.common.unknown}</span>
          </span>
          {ticket.agent?.full_name && (
            <span className="hidden sm:flex items-center gap-1 text-primary">
              <AssignArrow className="h-3 w-3" />
              {ticket.agent.full_name}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 shrink-0">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: dateLocale })}
        </span>
      </div>
    </button>
  );
}));
