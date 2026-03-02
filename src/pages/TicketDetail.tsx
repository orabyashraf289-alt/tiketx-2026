import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTicketById, fetchComments, addComment, updateTicket, fetchAuditLogs, addAuditLog, fetchAgents, fetchAttachments, addAttachment, fetchServices, fetchServiceCategories, fetchTicketFieldValues, fetchServiceFields, TicketStatus, TicketPriority, NoteType, statusLabels, priorityLabels } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { StatusBadge, PriorityBadge } from '@/components/TicketBadges';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, User, Clock, Tag, MessageCircle, Send, Loader2, History, Lock, Globe, RotateCcw, Paperclip, FileText } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const allStatuses: TicketStatus[] = ['new', 'open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed', 'reopened'];
const allPriorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [reply, setReply] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [pendingStatus, setPendingStatus] = useState<TicketStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const { data: attachments = [] } = useQuery({
    queryKey: ['attachments', id],
    queryFn: () => fetchAttachments(id!),
    enabled: !!id,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => fetchServices(),
    enabled: role === 'agent' || role === 'admin',
  });

  const { data: fieldValues = [] } = useQuery({
    queryKey: ['ticket-field-values', id],
    queryFn: () => fetchTicketFieldValues(id!),
    enabled: !!id,
  });

  const { data: serviceFields = [] } = useQuery({
    queryKey: ['service-fields', ticket?.service_id],
    queryFn: () => fetchServiceFields(ticket?.service_id || undefined),
    enabled: !!ticket?.service_id,
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
    mutationFn: async ({ newStatus, summary }: { newStatus: TicketStatus; summary?: string }) => {
      const oldStatus = ticket!.status;
      await updateTicket(id!, {
        status: newStatus,
        ...(newStatus === 'resolved' ? { resolved_at: new Date().toISOString(), resolution_summary: summary || null } : {}),
        ...(newStatus === 'closed' ? { closed_at: new Date().toISOString(), resolution_summary: summary || ticket!.resolution_summary || null } : {}),
        ...(newStatus === 'reopened' ? { resolved_at: null, closed_at: null } : {}),
      } as any);
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
      setShowResolveDialog(false);
      setResolutionSummary('');
      setPendingStatus(null);
      toast({ title: 'تم تحديث الحالة' });
    },
  });

  const handleStatusChange = (newStatus: TicketStatus) => {
    if (newStatus === 'resolved' || newStatus === 'closed') {
      setPendingStatus(newStatus);
      setShowResolveDialog(true);
    } else {
      statusMutation.mutate({ newStatus });
    }
  };

  const handleReopen = () => {
    statusMutation.mutate({ newStatus: 'reopened' });
  };

  const fileUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const filePath = `${id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('ticket-attachments').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('ticket-attachments').getPublicUrl(filePath);
      await addAttachment({
        ticket_id: id!,
        uploaded_by: user!.id,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', id] });
      toast({ title: 'تم رفع الملف' });
    },
    onError: (err: any) => {
      toast({ title: 'خطأ في رفع الملف', description: err.message, variant: 'destructive' });
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

  const priorityMutation = useMutation({
    mutationFn: async (newPriority: TicketPriority) => {
      const oldPriority = ticket!.priority;
      await updateTicket(id!, { priority: newPriority } as any);
      await addAuditLog({
        ticket_id: id!,
        user_id: user!.id,
        action: 'تغيير الأولوية',
        old_value: priorityLabels[oldPriority],
        new_value: priorityLabels[newPriority],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast({ title: 'تم تحديث الأولوية' });
    },
  });

  const serviceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const svc = services.find(s => s.id === serviceId);
      await updateTicket(id!, { service_id: serviceId } as any);
      await addAuditLog({
        ticket_id: id!,
        user_id: user!.id,
        action: 'تغيير الخدمة',
        new_value: svc?.name || serviceId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs', id] });
      toast({ title: 'تم تحديث الخدمة' });
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
            <h1 className="text-lg font-bold truncate">تذكرة {ticket.code || `#${ticket.ticket_number}`}</h1>
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

                    {ticket.resolution_summary && (
                      <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/20">
                        <p className="text-xs font-semibold text-success mb-1">ملخص الحل</p>
                        <p className="text-sm">{ticket.resolution_summary}</p>
                      </div>
                    )}

                    {/* Attachments */}
                    {attachments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">المرفقات</p>
                        <div className="flex flex-wrap gap-2">
                          {attachments.map(att => (
                            <a key={att.id} href={att.file_url} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1.5 text-xs bg-muted px-2.5 py-1.5 rounded-md hover:bg-muted/80 transition-colors">
                              <FileText className="h-3.5 w-3.5" />
                              {att.file_name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* File upload + Reopen */}
                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                      <input ref={fileInputRef} type="file" className="hidden" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) fileUploadMutation.mutate(file);
                        e.target.value = '';
                      }} />
                      <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => fileInputRef.current?.click()} disabled={fileUploadMutation.isPending}>
                        {fileUploadMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
                        إرفاق ملف
                      </Button>
                      {!isAgentOrAdmin && (ticket.status === 'resolved' || ticket.status === 'closed') && (
                        <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleReopen} disabled={statusMutation.isPending}>
                          <RotateCcw className="h-3 w-3" />
                          إعادة فتح
                        </Button>
                      )}
                    </div>
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
                    {ticket.services && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">الخدمة</p>
                          <p className="font-medium">{ticket.services.systems?.name} → {ticket.services.name}</p>
                        </div>
                      </div>
                    )}
                    {ticket.service_categories && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">التصنيف</p>
                          <p className="font-medium">{ticket.service_categories.name}</p>
                        </div>
                      </div>
                    )}
                    {ticket.source_system && ticket.source_system !== 'PORTAL' && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">المصدر</p>
                          <p className="font-medium">{ticket.source_system}</p>
                          {ticket.external_reference && <p className="text-xs text-muted-foreground">المرجع: {ticket.external_reference}</p>}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions for agents/admins */}
                {isAgentOrAdmin && (
                  <>
                    <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                      <CardHeader><CardTitle className="text-sm">إجراءات</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">تغيير الحالة</Label>
                          <Select value={ticket.status} onValueChange={(v) => handleStatusChange(v as TicketStatus)}>
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
                        <div className="space-y-2">
                          <Label className="text-xs">تغيير الأولوية</Label>
                          <Select value={ticket.priority} onValueChange={(v) => priorityMutation.mutate(v as TicketPriority)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {allPriorities.map(p => (
                                <SelectItem key={p} value={p}>{priorityLabels[p]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">تغيير الخدمة</Label>
                          <Select value={ticket.service_id || ''} onValueChange={v => serviceMutation.mutate(v)}>
                            <SelectTrigger><SelectValue placeholder="اختر الخدمة" /></SelectTrigger>
                            <SelectContent>
                              {services.map(s => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.systems?.name} → {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    {serviceFields.length > 0 && (
                      <Card className="animate-fade-in" style={{ animationDelay: '150ms' }}>
                        <CardHeader><CardTitle className="text-sm">حقول مخصصة</CardTitle></CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          {serviceFields.map(f => {
                            const val = fieldValues.find(v => v.field_id === f.id);
                            return (
                              <div key={f.id}>
                                <p className="text-xs text-muted-foreground">{f.field_name}</p>
                                <p className="font-medium">{val?.value || '-'}</p>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Resolution Summary Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{pendingStatus === 'resolved' ? 'حل التذكرة' : 'إغلاق التذكرة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>ملخص الحل</Label>
              <Textarea
                value={resolutionSummary}
                onChange={e => setResolutionSummary(e.target.value)}
                placeholder="اكتب ملخص الحل أو سبب الإغلاق..."
                className="min-h-[100px]"
              />
            </div>
            <Button
              className="w-full gradient-accent text-accent-foreground"
              disabled={statusMutation.isPending}
              onClick={() => {
                if (pendingStatus) {
                  statusMutation.mutate({ newStatus: pendingStatus, summary: resolutionSummary.trim() });
                }
              }}
            >
              {statusMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              تأكيد
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
