import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTicketById, fetchComments, addComment, updateTicket, fetchAuditLogs, addAuditLog, fetchAgents, TicketStatus, NoteType, statusLabels } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { StatusBadge, PriorityBadge } from '@/components/TicketBadges';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, User, Clock, Tag, MessageCircle, Send, Loader2, History, Lock, Globe } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const allStatuses: TicketStatus[] = ['new', 'open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed', 'reopened'];

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [reply, setReply] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => fetchTicketById(id!),
    enabled: !!id,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => fetchComments(id!),
    enabled: !!id,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit-logs', id],
    queryFn: () => fetchAuditLogs(id!),
    enabled: !!id && (role === 'agent' || role === 'admin'),
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
    enabled: role === 'agent' || role === 'admin',
  });

  const commentMutation = useMutation({
    mutationFn: () => addComment({
      ticket_id: id!,
      author_id: user!.id,
      content: reply.trim(),
      note_type: isPrivate ? 'private' : 'public',
    }),
    onSuccess: () => {
      setReply('');
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      toast({ title: 'تم إضافة التعليق' });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: TicketStatus) => {
      const oldStatus = ticket!.status;
      await updateTicket(id!, {
        status: newStatus,
        ...(newStatus === 'resolved' ? { resolved_at: new Date().toISOString() } : {}),
        ...(newStatus === 'closed' ? { closed_at: new Date().toISOString() } : {}),
      });
      await addAuditLog({
        ticket_id: id!,
        user_id: user!.id,
        action: 'تغيير الحالة',
        old_value: statusLabels[oldStatus],
        new_value: statusLabels[newStatus],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
      toast({ title: 'تم تحديث الحالة' });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (agentId: string) => {
      await updateTicket(id!, { assigned_agent_id: agentId });
      const agentName = agents.find((a: any) => a.user_id === agentId)?.profiles?.full_name || agentId;
      await addAuditLog({
        ticket_id: id!,
        user_id: user!.id,
        action: 'تعيين معالج',
        new_value: agentName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs', id] });
      toast({ title: 'تم تعيين المعالج' });
    },
  });

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!ticket) return null;

  const isAgentOrAdmin = role === 'agent' || role === 'admin';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-3 shrink-0">
            <SidebarTrigger />
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold truncate">تذكرة #{ticket.ticket_number}</h1>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="animate-fade-in">
                  <CardHeader>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                      {ticket.departments?.name && (
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{ticket.departments.name}</span>
                      )}
                    </div>
                    <CardTitle className="text-xl">{ticket.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                  </CardContent>
                </Card>

                {/* Comments */}
                <Card>
                  <Tabs defaultValue="comments" dir="rtl">
                    <CardHeader className="pb-2">
                      <TabsList>
                        <TabsTrigger value="comments" className="gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />
                          المحادثة ({comments.length})
                        </TabsTrigger>
                        {isAgentOrAdmin && (
                          <TabsTrigger value="audit" className="gap-1">
                            <History className="h-3.5 w-3.5" />
                            سجل التغييرات
                          </TabsTrigger>
                        )}
                      </TabsList>
                    </CardHeader>
                    <CardContent>
                      <TabsContent value="comments" className="mt-0">
                        <div className="space-y-4 mb-6">
                          {comments.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">لا توجد تعليقات بعد</p>
                          ) : (
                            comments.map(c => (
                              <div key={c.id} className={`rounded-lg p-4 ${c.note_type === 'private' ? 'bg-warning/5 border border-warning/20' : 'bg-muted'}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold">{c.author?.full_name}</span>
                                    {c.note_type === 'private' && (
                                      <span className="text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                        <Lock className="h-2.5 w-2.5" />
                                        ملاحظة خاصة
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(c.created_at), 'd MMM, HH:mm', { locale: ar })}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Reply box */}
                        <div className="space-y-3 border-t pt-4">
                          <Textarea
                            placeholder="اكتب تعليقك هنا..."
                            value={reply}
                            onChange={e => setReply(e.target.value)}
                            className="min-h-[80px] resize-none"
                            maxLength={2000}
                          />
                          <div className="flex items-center justify-between">
                            {isAgentOrAdmin && (
                              <div className="flex items-center gap-2">
                                <Switch id="private" checked={isPrivate} onCheckedChange={setIsPrivate} />
                                <Label htmlFor="private" className="text-xs flex items-center gap-1">
                                  {isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                                  {isPrivate ? 'ملاحظة خاصة' : 'تعليق عام'}
                                </Label>
                              </div>
                            )}
                            <Button
                              className="gradient-accent text-accent-foreground gap-2"
                              disabled={!reply.trim() || commentMutation.isPending}
                              onClick={() => commentMutation.mutate()}
                            >
                              {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                              إرسال
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      {isAgentOrAdmin && (
                        <TabsContent value="audit" className="mt-0">
                          {auditLogs.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">لا يوجد سجل تغييرات</p>
                          ) : (
                            <div className="space-y-3">
                              {auditLogs.map(log => (
                                <div key={log.id} className="flex items-start gap-3 text-sm">
                                  <div className="h-2 w-2 rounded-full bg-accent mt-1.5 shrink-0" />
                                  <div>
                                    <p>
                                      <span className="font-medium">{log.user?.full_name}</span>
                                      {' '}قام بـ{' '}
                                      <span className="font-medium">{log.action}</span>
                                      {log.old_value && <> من <span className="text-muted-foreground">{log.old_value}</span></>}
                                      {log.new_value && <> إلى <span className="font-medium">{log.new_value}</span></>}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ar })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      )}
                    </CardContent>
                  </Tabs>
                </Card>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-4">
                <Card className="animate-fade-in">
                  <CardHeader><CardTitle className="text-sm">معلومات التذكرة</CardTitle></CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">مقدم الطلب</p>
                        <p className="font-medium">{ticket.requester?.full_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">المعالج</p>
                        <p className="font-medium">{ticket.agent?.full_name || 'غير معيّن'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
                        <p className="font-medium">{format(new Date(ticket.created_at), 'd MMM yyyy, HH:mm', { locale: ar })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">القسم</p>
                        <p className="font-medium">{ticket.departments?.name || '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions for agents/admins */}
                {isAgentOrAdmin && (
                  <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <CardHeader><CardTitle className="text-sm">إجراءات</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs">تغيير الحالة</Label>
                        <Select value={ticket.status} onValueChange={(v) => statusMutation.mutate(v as TicketStatus)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {allStatuses.map(s => (
                              <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">تعيين معالج</Label>
                        <Select value={ticket.assigned_agent_id || ''} onValueChange={v => assignMutation.mutate(v)}>
                          <SelectTrigger><SelectValue placeholder="اختر معالج" /></SelectTrigger>
                          <SelectContent>
                            {agents.map((a: any) => (
                              <SelectItem key={a.user_id} value={a.user_id}>
                                {a.profiles?.full_name || a.user_id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
