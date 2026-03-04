import { Ticket } from '@/lib/api';
import { StatusBadge, PriorityBadge, SLABadge } from '@/components/TicketBadges';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  tickets: Ticket[];
  onTicketClick: (id: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
}

export function TicketTableView({ tickets, onTicketClick, page, onPageChange, pageSize = 20 }: Props) {
  const totalPages = Math.max(1, Math.ceil(tickets.length / pageSize));
  const paginated = tickets.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex flex-col">
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right w-[100px]">الكود</TableHead>
              <TableHead className="text-right">العنوان</TableHead>
              <TableHead className="text-right w-[140px]">العميل</TableHead>
              <TableHead className="text-right w-[110px]">الحالة</TableHead>
              <TableHead className="text-right w-[100px]">الأولوية</TableHead>
              <TableHead className="text-right w-[110px]">SLA</TableHead>
              <TableHead className="text-right w-[120px]">النظام</TableHead>
              <TableHead className="text-right w-[100px]">التاريخ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map(ticket => (
              <TableRow
                key={ticket.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onTicketClick(ticket.id)}
              >
                <TableCell className="font-mono text-xs font-medium text-muted-foreground">
                  {ticket.code || `#${ticket.ticket_number}`}
                </TableCell>
                <TableCell>
                  <span className="font-medium text-sm line-clamp-1">{ticket.title}</span>
                </TableCell>
                <TableCell className="text-sm">{ticket.requester?.full_name || 'غير معروف'}</TableCell>
                <TableCell><StatusBadge status={ticket.status} /></TableCell>
                <TableCell><PriorityBadge priority={ticket.priority} /></TableCell>
                <TableCell><SLABadge slaResolutionDueAt={ticket.sla_resolution_due_at} resolvedAt={ticket.resolved_at} /></TableCell>
                <TableCell className="text-xs">
                  {ticket.services?.systems?.name ? (
                    <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                      {ticket.services.systems.name}
                    </span>
                  ) : '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: ar })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            عرض {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, tickets.length)} من {tickets.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) {
                p = i + 1;
              } else if (page <= 3) {
                p = i + 1;
              } else if (page >= totalPages - 2) {
                p = totalPages - 4 + i;
              } else {
                p = page - 2 + i;
              }
              return (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8 rounded-lg text-xs"
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
