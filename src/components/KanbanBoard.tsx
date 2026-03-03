import { useState } from 'react';
import { Ticket, TicketStatus, statusLabels, updateTicket } from '@/lib/api';
import { PriorityBadge } from '@/components/TicketBadges';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Clock, User, GripVertical, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const KANBAN_COLUMNS: TicketStatus[] = ['new', 'open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'];

const columnColors: Record<TicketStatus, string> = {
  new: 'border-t-info',
  open: 'border-t-primary',
  in_progress: 'border-t-warning',
  waiting_on_customer: 'border-t-accent',
  resolved: 'border-t-success',
  closed: 'border-t-muted-foreground',
  reopened: 'border-t-destructive',
};

interface Props {
  tickets: Ticket[];
  isAdmin: boolean;
}

export function KanbanBoard({ tickets, isAdmin }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TicketStatus | null>(null);

  const columns = KANBAN_COLUMNS.map(status => ({
    status,
    label: statusLabels[status],
    tickets: tickets.filter(t => t.status === status),
  }));

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    e.dataTransfer.setData('ticketId', ticketId);
    setDraggedId(ticketId);
  };

  const handleDragOver = (e: React.DragEvent, status: TicketStatus) => {
    e.preventDefault();
    setDragOverCol(status);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TicketStatus) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    setDraggedId(null);
    setDragOverCol(null);

    if (!isAdmin) {
      toast({ title: 'غير مسموح', description: 'لا يمكنك تغيير حالة التذكرة', variant: 'destructive' });
      return;
    }

    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket || ticket.status === newStatus) return;

    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'resolved') updates.resolved_at = new Date().toISOString();
      if (newStatus === 'closed') updates.closed_at = new Date().toISOString();
      await updateTicket(ticketId, updates);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast({ title: `تم تغيير الحالة إلى ${statusLabels[newStatus]}` });
    } catch {
      toast({ title: 'خطأ في تحديث الحالة', variant: 'destructive' });
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px]">
      {columns.map(col => (
        <div
          key={col.status}
          onDragOver={e => handleDragOver(e, col.status)}
          onDragLeave={() => setDragOverCol(null)}
          onDrop={e => handleDrop(e, col.status)}
          className={`flex-shrink-0 w-64 rounded-xl border-t-4 ${columnColors[col.status]} bg-card border border-border/50 flex flex-col transition-all ${
            dragOverCol === col.status ? 'ring-2 ring-primary/40 bg-primary/5' : ''
          }`}
        >
          {/* Column header */}
          <div className="p-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground">{col.label}</h3>
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                {col.tickets.length}
              </span>
            </div>
          </div>

          {/* Cards */}
          <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[60vh]">
            {col.tickets.map(ticket => {
              const isOverdue = ticket.sla_resolution_due_at && !ticket.resolved_at && new Date(ticket.sla_resolution_due_at) < new Date();
              return (
                <motion.div
                  key={ticket.id}
                  draggable={isAdmin}
                  onDragStart={(e: any) => handleDragStart(e, ticket.id)}
                  onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
                  whileHover={{ y: -2 }}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className={`p-3 rounded-lg border border-border/50 bg-background cursor-pointer hover:shadow-card-hover transition-all ${
                    draggedId === ticket.id ? 'opacity-40' : ''
                  } ${isOverdue ? 'border-r-2 border-r-destructive' : ''}`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {ticket.code || `#${ticket.ticket_number}`}
                    </span>
                    {isAdmin && <GripVertical className="h-3 w-3 text-muted-foreground/50 cursor-grab flex-shrink-0" />}
                  </div>
                  <h4 className="text-xs font-semibold text-foreground line-clamp-2 mb-2">{ticket.title}</h4>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <PriorityBadge priority={ticket.priority} />
                    {isOverdue && (
                      <span className="text-[9px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <AlertTriangle className="h-2 w-2" />
                        متأخرة
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5 truncate">
                      <User className="h-2.5 w-2.5" />
                      {ticket.requester?.full_name?.split(' ')[0] || '—'}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: ar })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
            {col.tickets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground/40 text-xs">
                لا توجد تذاكر
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
