import { Ticket } from "@/types/ticket";
import { StatusBadge, PriorityBadge } from "@/components/TicketBadges";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { User } from "lucide-react";

interface TicketListProps {
  tickets: Ticket[];
  onSelect: (ticket: Ticket) => void;
  selectedId?: string;
}

export function TicketList({ tickets, onSelect, selectedId }: TicketListProps) {
  return (
    <div className="space-y-2">
      {tickets.map((ticket, i) => (
        <button
          key={ticket.id}
          onClick={() => onSelect(ticket)}
          className={`w-full text-right rounded-lg border bg-card p-4 transition-all duration-200 hover:shadow-card-hover animate-fade-in ${
            selectedId === ticket.id
              ? "border-accent ring-2 ring-accent/20"
              : "border-border hover:border-accent/40"
          }`}
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">{ticket.id}</span>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
              <h3 className="font-semibold text-sm truncate">{ticket.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{ticket.description}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3" />
              <span>{ticket.requester.name}</span>
            </div>
            <span>
              {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: ar })}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
