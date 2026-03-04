import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { updateTicketApproval, approvalStatusLabels, ApprovalStatus } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { sanitizeError } from '@/lib/errorHandler';
import { Clock, Check, X, User, GripVertical, AlertTriangle, Forward } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

type ApprovalCol = 'pending' | 'approved' | 'rejected';

const columnConfig: Record<ApprovalCol, { label: string; borderColor: string; icon: typeof Clock }> = {
  pending: { label: 'في الانتظار', borderColor: 'border-t-warning', icon: Clock },
  approved: { label: 'معتمد', borderColor: 'border-t-success', icon: Check },
  rejected: { label: 'مرفوض', borderColor: 'border-t-destructive', icon: X },
};

interface ApprovalCard {
  id: string;
  ticket_id: string;
  status: ApprovalStatus;
  deadline_at: string | null;
  is_escalated: boolean;
  delegated_to: string | null;
  created_at: string;
  approval_stages: { stage_name: string; stage_order: number } | null;
  ticket: { ticket_number: number; title: string; code: string | null } | null;
  approver: { full_name: string } | null;
  delegated_profile: { full_name: string } | null;
}

export function ApprovalKanban() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ApprovalCol | null>(null);

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['approval-kanban'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_approvals')
        .select('id, ticket_id, status, deadline_at, is_escalated, delegated_to, created_at, approval_stages(stage_name, stage_order), ticket:tickets!ticket_approvals_ticket_id_fkey(ticket_number, title, code), approver:profiles!ticket_approvals_approver_id_fkey(full_name), delegated_profile:profiles!ticket_approvals_delegated_to_fkey(full_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown) as ApprovalCard[];
    },
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApprovalStatus }) =>
      updateTicketApproval(id, { status, approver_id: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast({ title: 'تم تحديث الاعتماد' });
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: sanitizeError(err), variant: 'destructive' });
    },
  });

  const columns: ApprovalCol[] = ['pending', 'approved', 'rejected'];

  const handleDragStart = (e: React.DragEvent, approvalId: string) => {
    e.dataTransfer.setData('approvalId', approvalId);
    setDraggedId(approvalId);
  };

  const handleDrop = (e: React.DragEvent, newStatus: ApprovalCol) => {
    e.preventDefault();
    const approvalId = e.dataTransfer.getData('approvalId');
    setDraggedId(null);
    setDragOverCol(null);

    const approval = approvals.find(a => a.id === approvalId);
    if (!approval || approval.status === newStatus || approval.status !== 'pending') {
      if (approval?.status !== 'pending') {
        toast({ title: 'لا يمكن تغيير حالة اعتماد تم البت فيه', variant: 'destructive' });
      }
      return;
    }

    if (newStatus === 'pending') return; // Can't move back to pending
    mutation.mutate({ id: approvalId, status: newStatus });
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Clock className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px]">
      {columns.map(col => {
        const config = columnConfig[col];
        const colApprovals = approvals.filter(a => a.status === col);
        const ColIcon = config.icon;

        return (
          <div
            key={col}
            onDragOver={e => { e.preventDefault(); setDragOverCol(col); }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={e => handleDrop(e, col)}
            className={`flex-shrink-0 w-72 rounded-xl border-t-4 ${config.borderColor} bg-card border border-border/50 flex flex-col transition-all ${
              dragOverCol === col ? 'ring-2 ring-primary/40 bg-primary/5' : ''
            }`}
          >
            <div className="p-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ColIcon className="h-3.5 w-3.5" />
                  {config.label}
                </h3>
                <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                  {colApprovals.length}
                </span>
              </div>
            </div>

            <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[60vh]">
              {colApprovals.map(approval => {
                const isOverdue = approval.deadline_at && approval.status === 'pending' && isPast(new Date(approval.deadline_at));
                return (
                  <motion.div
                    key={approval.id}
                    draggable={approval.status === 'pending'}
                    onDragStart={(e: any) => handleDragStart(e, approval.id)}
                    onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
                    whileHover={{ y: -2 }}
                    onClick={() => approval.ticket_id && navigate(`/tickets/${approval.ticket_id}`)}
                    className={`p-3 rounded-lg border border-border/50 bg-background cursor-pointer hover:shadow-card-hover transition-all ${
                      draggedId === approval.id ? 'opacity-40' : ''
                    } ${isOverdue ? 'border-r-2 border-r-destructive' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {approval.ticket?.code || `#${approval.ticket?.ticket_number}`}
                      </span>
                      {approval.status === 'pending' && <GripVertical className="h-3 w-3 text-muted-foreground/50 cursor-grab flex-shrink-0" />}
                    </div>

                    <h4 className="text-xs font-semibold text-foreground line-clamp-2 mb-1.5">
                      {approval.ticket?.title}
                    </h4>

                    <p className="text-[10px] text-muted-foreground mb-2">
                      المرحلة: {approval.approval_stages?.stage_name}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isOverdue && (
                        <Badge variant="destructive" className="text-[9px] gap-0.5 px-1.5 py-0">
                          <AlertTriangle className="h-2 w-2" />
                          متأخر
                        </Badge>
                      )}
                      {approval.is_escalated && (
                        <Badge variant="destructive" className="text-[9px] gap-0.5 px-1.5 py-0">
                          مُصعّد
                        </Badge>
                      )}
                      {approval.delegated_profile?.full_name && (
                        <Badge variant="secondary" className="text-[9px] gap-0.5 px-1.5 py-0">
                          <Forward className="h-2 w-2" />
                          {approval.delegated_profile.full_name}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                      {approval.approver?.full_name ? (
                        <span className="flex items-center gap-0.5 truncate">
                          <User className="h-2.5 w-2.5" />
                          {approval.approver.full_name}
                        </span>
                      ) : <span />}
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true, locale: ar })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              {colApprovals.length === 0 && (
                <div className="text-center py-8 text-muted-foreground/40 text-xs">
                  لا توجد اعتمادات
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
