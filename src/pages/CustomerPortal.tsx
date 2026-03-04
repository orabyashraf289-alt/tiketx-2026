import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTickets, fetchComments, addComment, createTicket, fetchSystems, fetchServices, fetchDepartments, statusLabels, priorityLabels, Ticket, TicketComment } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Inbox, Loader2, Send, ArrowRight, LogOut, User, Clock, MessageSquare, Ticket as TicketIcon, ChevronRight, Home } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { CustomerChatbot } from '@/components/CustomerChatbot';

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  open: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  in_progress: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
  waiting_on_customer: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  resolved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  closed: 'bg-muted text-muted-foreground',
  reopened: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

const priorityColors: Record<string, string> = {
  low: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  medium: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
  high: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  urgent: 'bg-red-500/15 text-red-600 dark:text-red-300',
};

export default function CustomerPortal() {
  const { user, profile, signOut } = useAuth();
  const { system_name, logo_url } = useSystemSettings();
  const queryClient = useQueryClient();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [newComment, setNewComment] = useState('');
  const [showNewTicket, setShowNewTicket] = useState(false);

  // New ticket form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [selectedSystem, setSelectedSystem] = useState('');
  const [selectedService, setSelectedService] = useState('');

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: fetchTickets,
  });

  const { data: systems = [] } = useQuery({ queryKey: ['systems'], queryFn: fetchSystems });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });
  const { data: allServices = [] } = useQuery({ queryKey: ['services'], queryFn: () => fetchServices() });

  const filteredServices = allServices.filter(s => s.system_id === selectedSystem);

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', selectedTicket?.id],
    queryFn: () => fetchComments(selectedTicket!.id),
    enabled: !!selectedTicket,
  });

  // Realtime: comments on selected ticket
  useEffect(() => {
    if (!selectedTicket) return;
    const channel = supabase
      .channel(`portal-comments-${selectedTicket.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_comments', filter: `ticket_id=eq.${selectedTicket.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['comments', selectedTicket.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedTicket?.id, queryClient]);

  // Realtime: ticket status changes
  useEffect(() => {
    const channel = supabase
      .channel('portal-tickets-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
        // Show toast for status changes on user's tickets
        if (payload.eventType === 'UPDATE' && payload.old && payload.new) {
          const oldStatus = (payload.old as any).status;
          const newStatus = (payload.new as any).status;
          if (oldStatus !== newStatus) {
            const ticketNum = (payload.new as any).ticket_number;
            toast.info(`تم تغيير حالة التذكرة #${ticketNum} إلى ${statusLabels[newStatus as keyof typeof statusLabels] || newStatus}`);
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Realtime: notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('portal-notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        const notif = payload.new as any;
        toast(notif.title, { description: notif.message });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const commentMutation = useMutation({
    mutationFn: () => addComment({ ticket_id: selectedTicket!.id, author_id: user!.id, content: newComment, note_type: 'public' }),
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['comments', selectedTicket?.id] });
      toast.success('تم إرسال الرسالة');
    },
  });

  const ticketMutation = useMutation({
    mutationFn: async () => {
      const svc = allServices.find(s => s.id === selectedService);
      return createTicket({
        title,
        description,
        priority: priority as any,
        department_id: svc?.default_assignment_group || departments[0]?.id || '',
        requester_id: user!.id,
        service_id: selectedService || undefined,
      });
    },
    onSuccess: () => {
      setShowNewTicket(false);
      setTitle(''); setDescription(''); setPriority('medium'); setSelectedSystem(''); setSelectedService('');
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('تم إنشاء التذكرة بنجاح');
    },
    onError: () => toast.error('حدث خطأ أثناء إنشاء التذكرة'),
  });

  const myTickets = tickets.filter(t => {
    const matchSearch = !searchQuery || t.title.includes(searchQuery) || t.code?.includes(searchQuery);
    const matchStatus = statusTab === 'all' || (statusTab === 'active' ? !['closed', 'resolved'].includes(t.status) : ['closed', 'resolved'].includes(t.status));
    return matchSearch && matchStatus;
  });

  const activeCount = tickets.filter(t => !['closed', 'resolved'].includes(t.status)).length;
  const resolvedCount = tickets.filter(t => ['closed', 'resolved'].includes(t.status)).length;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logo_url ? (
              <img src={logo_url} alt={system_name} className="h-8 w-8 object-contain rounded-lg" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Home className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">{system_name}</h1>
              <p className="text-[10px] text-muted-foreground">بوابة العملاء</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsPopover />
            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground hidden sm:inline">{profile?.full_name}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {selectedTicket ? (
            <TicketDetailView
              key="detail"
              ticket={selectedTicket}
              comments={comments}
              commentsLoading={commentsLoading}
              newComment={newComment}
              setNewComment={setNewComment}
              onSendComment={() => commentMutation.mutate()}
              sending={commentMutation.isPending}
              onBack={() => setSelectedTicket(null)}
            />
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <Card className="border-border/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{tickets.length}</p>
                    <p className="text-xs text-muted-foreground">إجمالي التذاكر</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{activeCount}</p>
                    <p className="text-xs text-muted-foreground">نشطة</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{resolvedCount}</p>
                    <p className="text-xs text-muted-foreground">محلولة</p>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في تذاكري..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9 rounded-xl" />
                </div>
                <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">تذكرة جديدة</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>إنشاء تذكرة جديدة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">العنوان</label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان المشكلة أو الطلب" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">الوصف</label>
                        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="اشرح المشكلة بالتفصيل..." rows={4} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">النظام</label>
                          <Select value={selectedSystem} onValueChange={v => { setSelectedSystem(v); setSelectedService(''); }}>
                            <SelectTrigger><SelectValue placeholder="اختر النظام" /></SelectTrigger>
                            <SelectContent>
                              {systems.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">الخدمة</label>
                          <Select value={selectedService} onValueChange={setSelectedService} disabled={!selectedSystem}>
                            <SelectTrigger><SelectValue placeholder="اختر الخدمة" /></SelectTrigger>
                            <SelectContent>
                              {filteredServices.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">الأولوية</label>
                        <Select value={priority} onValueChange={setPriority}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">منخفضة</SelectItem>
                            <SelectItem value="medium">متوسطة</SelectItem>
                            <SelectItem value="high">عالية</SelectItem>
                            <SelectItem value="urgent">عاجلة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full" onClick={() => ticketMutation.mutate()} disabled={!title || !description || ticketMutation.isPending}>
                        {ticketMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                        إرسال التذكرة
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Tabs */}
              <Tabs value={statusTab} onValueChange={setStatusTab} dir="rtl">
                <TabsList className="bg-muted/50 mb-4">
                  <TabsTrigger value="all">الكل ({tickets.length})</TabsTrigger>
                  <TabsTrigger value="active">نشطة ({activeCount})</TabsTrigger>
                  <TabsTrigger value="resolved">محلولة ({resolvedCount})</TabsTrigger>
                </TabsList>

                <TabsContent value={statusTab} className="mt-0">
                  {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                  ) : myTickets.length === 0 ? (
                    <div className="flex flex-col items-center py-20 text-muted-foreground">
                      <Inbox className="h-12 w-12 mb-3 opacity-30" />
                      <p className="font-medium">لا توجد تذاكر</p>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                      {myTickets.map((ticket, i) => (
                        <motion.div
                          key={ticket.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <Card
                            className="cursor-pointer hover:shadow-md transition-all border-border/50 hover:border-primary/30 group"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <CardContent className="p-4 flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] text-muted-foreground font-mono">{ticket.code}</span>
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 ${statusColors[ticket.status]}`}>
                                    {statusLabels[ticket.status]}
                                  </Badge>
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 ${priorityColors[ticket.priority]}`}>
                                    {priorityLabels[ticket.priority]}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium text-foreground truncate">{ticket.title}</p>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(ticket.created_at), 'dd MMM yyyy', { locale: ar })}
                                  </span>
                                  {ticket.services && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {ticket.services.systems?.name} → {ticket.services.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors rotate-180" />
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <CustomerChatbot />
    </div>
  );
}

function TicketDetailView({
  ticket, comments, commentsLoading, newComment, setNewComment, onSendComment, sending, onBack,
}: {
  ticket: Ticket;
  comments: TicketComment[];
  commentsLoading: boolean;
  newComment: string;
  setNewComment: (v: string) => void;
  onSendComment: () => void;
  sending: boolean;
  onBack: () => void;
}) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new comments arrive
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [comments.length]);

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
      <Button variant="ghost" size="sm" className="gap-1.5 mb-4 text-muted-foreground" onClick={onBack}>
        <ArrowRight className="h-4 w-4" />
        العودة للتذاكر
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ticket info */}
        <Card className="lg:col-span-1 border-border/50 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">تفاصيل التذكرة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-[10px] text-muted-foreground">الكود</span>
              <p className="text-sm font-mono font-medium">{ticket.code}</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">العنوان</span>
              <p className="text-sm font-medium">{ticket.title}</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">الوصف</span>
              <p className="text-sm text-muted-foreground leading-relaxed">{ticket.description}</p>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <span className="text-[10px] text-muted-foreground">الحالة</span>
                <Badge className={`mt-1 w-full justify-center border-0 ${statusColors[ticket.status]}`}>
                  {statusLabels[ticket.status]}
                </Badge>
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-muted-foreground">الأولوية</span>
                <Badge className={`mt-1 w-full justify-center border-0 ${priorityColors[ticket.priority]}`}>
                  {priorityLabels[ticket.priority]}
                </Badge>
              </div>
            </div>
            {ticket.services && (
              <div>
                <span className="text-[10px] text-muted-foreground">الخدمة</span>
                <p className="text-sm">{ticket.services.systems?.name} → {ticket.services.name}</p>
              </div>
            )}
            <div>
              <span className="text-[10px] text-muted-foreground">تاريخ الإنشاء</span>
              <p className="text-sm">{format(new Date(ticket.created_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}</p>
            </div>
            {ticket.agent && (
              <div>
                <span className="text-[10px] text-muted-foreground">الوكيل المسؤول</span>
                <p className="text-sm">{ticket.agent.full_name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="lg:col-span-2 border-border/50 flex flex-col" style={{ minHeight: '60vh' }}>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              المحادثة
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1 p-4">
            {commentsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-muted-foreground">
                <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">لا توجد رسائل بعد</p>
                <p className="text-xs">أرسل رسالة للتواصل مع فريق الدعم</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map(c => {
                  const isMe = c.author_id === ticket.requester_id;
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
                        {!isMe && (
                          <p className="text-[10px] font-medium mb-1 opacity-70">{c.author?.full_name || 'الدعم الفني'}</p>
                        )}
                        <p className="text-sm leading-relaxed">{c.content}</p>
                        <p className={`text-[9px] mt-1 ${isMe ? 'opacity-70' : 'text-muted-foreground'}`}>
                          {format(new Date(c.created_at), 'HH:mm - dd/MM', { locale: ar })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            )}
          </ScrollArea>
          <div className="p-3 border-t flex gap-2">
            <Input
              placeholder="اكتب رسالتك..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && newComment.trim() && onSendComment()}
              className="rounded-xl"
            />
            <Button size="icon" className="rounded-xl shrink-0" disabled={!newComment.trim() || sending} onClick={onSendComment}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
