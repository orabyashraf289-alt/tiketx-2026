import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTicketApprovals, updateTicketApproval, TicketApproval, ApprovalStatus, approvalStatusLabels } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, X, Clock, Loader2, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const statusConfig: Record<ApprovalStatus, { icon: typeof Check; color: string; bg: string }> = {
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/15 border-warning/30' },
  approved: { icon: Check, color: 'text-success', bg: 'bg-success/15 border-success/30' },
  rejected: { icon: X, color: 'text-destructive', bg: 'bg-destructive/15 border-destructive/30' },
};

interface ApprovalTimelineProps {
  ticketId: string;
  ticketStatus: string;
}

export function ApprovalTimeline({ ticketId, ticketStatus }: ApprovalTimelineProps) {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeApprovalId, setActiveApprovalId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['ticket-approvals', ticketId],
    queryFn: () => fetchTicketApprovals(ticketId),
    enabled: !!ticketId,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApprovalStatus }) =>
      updateTicketApproval(id, { status, approver_id: user!.id, notes: notes.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-approvals', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setActiveApprovalId(null);
      setNotes('');
      toast({ title: 'تم تحديث الاعتماد' });
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    },
  });

  if (isLoading || approvals.length === 0) return null;

  const isAgentOrAdmin = role === 'agent' || role === 'admin';

  // Determine current active stage order
  const sortedApprovals = [...approvals].sort(
    (a, b) => (a.approval_stages?.stage_order || 0) - (b.approval_stages?.stage_order || 0)
  );

  const currentStageOrder = sortedApprovals.find(a => a.status === 'pending')?.approval_stages?.stage_order;

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          مراحل الاعتماد
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          {sortedApprovals.map((approval, index) => {
            const config = statusConfig[approval.status];
            const Icon = config.icon;
            const isActive = approval.status === 'pending' && 
              approval.approval_stages?.stage_order === currentStageOrder;
            const isExpanded = activeApprovalId === approval.id;

            return (
              <motion.div
                key={approval.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Connector line */}
                {index < sortedApprovals.length - 1 && (
                  <div className={cn(
                    'absolute right-[15px] top-[32px] w-0.5 h-[calc(100%-16px)]',
                    approval.status === 'approved' ? 'bg-success/40' : 'bg-border'
                  )} />
                )}

                <div className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors mb-1',
                  isActive && 'bg-accent/5 border border-accent/20'
                )}>
                  {/* Status circle */}
                  <motion.div
                    animate={{ scale: isActive ? [1, 1.2, 1] : 1 }}
                    transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border shrink-0',
                      config.bg
                    )}
                  >
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{approval.approval_stages?.stage_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={cn('text-[10px]', config.bg, config.color)}>
                            {approvalStatusLabels[approval.status]}
                          </Badge>
                          {approval.approval_stages?.stage_type === 'parallel' && (
                            <span className="text-[10px] text-muted-foreground">متوازي</span>
                          )}
                        </div>
                      </div>

                      {/* Action button for agents/admins on active approvals */}
                      {isAgentOrAdmin && isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setActiveApprovalId(isExpanded ? null : approval.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </div>

                    {/* Decided info */}
                    {approval.decided_at && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {approval.approver?.full_name && `${approval.approver.full_name} · `}
                        {format(new Date(approval.decided_at), 'd MMM, HH:mm', { locale: ar })}
                      </p>
                    )}
                    {approval.notes && (
                      <p className="text-xs text-muted-foreground mt-1 bg-muted/50 p-2 rounded">
                        {approval.notes}
                      </p>
                    )}

                    {/* Action form */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 space-y-2 overflow-hidden"
                        >
                          <Textarea
                            placeholder="ملاحظات (اختياري)..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="min-h-[60px] text-xs"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground"
                              disabled={mutation.isPending}
                              onClick={() => mutation.mutate({ id: approval.id, status: 'approved' })}
                            >
                              {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              اعتماد
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1.5"
                              disabled={mutation.isPending}
                              onClick={() => mutation.mutate({ id: approval.id, status: 'rejected' })}
                            >
                              {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                              رفض
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
