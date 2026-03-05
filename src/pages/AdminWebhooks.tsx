import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Webhook, Plus, Trash2, Eye, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const EVENT_TYPES = [
  { value: 'ticket.created', label: 'إنشاء تذكرة' },
  { value: 'ticket.status_changed', label: 'تغيير حالة' },
  { value: 'ticket.assigned', label: 'تعيين وكيل' },
  { value: 'ticket.priority_changed', label: 'تغيير أولوية' },
  { value: 'ticket.comment_added', label: 'إضافة تعليق' },
  { value: 'ticket.resolved', label: 'حل التذكرة' },
  { value: 'ticket.closed', label: 'إغلاق التذكرة' },
];

export default function AdminWebhooks() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [logsWebhookId, setLogsWebhookId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', url: '', secret: '', events: [] as string[] });

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('webhook_endpoints').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['webhook-logs', logsWebhookId],
    queryFn: async () => {
      if (!logsWebhookId) return [];
      const { data, error } = await supabase.from('webhook_logs').select('*').eq('webhook_id', logsWebhookId).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!logsWebhookId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('webhook_endpoints').insert({
        name: form.name,
        url: form.url,
        secret: form.secret || null,
        events: form.events,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhooks'] });
      setOpen(false);
      setForm({ name: '', url: '', secret: '', events: [] });
      toast({ title: 'تم إنشاء Webhook ✅' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('webhook_endpoints').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('webhook_endpoints').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhooks'] });
      toast({ title: 'تم الحذف' });
    },
  });

  const toggleEvent = (ev: string) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(ev) ? f.events.filter(e => e !== ev) : [...f.events, ev],
    }));
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 gap-3 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <Webhook className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">Webhooks الصادرة</h1>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 ml-1" />إضافة Webhook</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader><DialogTitle>إضافة Webhook جديد</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div><Label>الاسم</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: إشعار ERP" /></div>
                    <div><Label>رابط URL</Label><Input dir="ltr" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://example.com/webhook" /></div>
                    <div><Label>مفتاح التوقيع (اختياري)</Label><Input dir="ltr" value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))} placeholder="secret_key" /></div>
                    <div>
                      <Label className="mb-2 block">الأحداث</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {EVENT_TYPES.map(ev => (
                          <label key={ev.value} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox checked={form.events.includes(ev.value)} onCheckedChange={() => toggleEvent(ev.value)} />
                            {ev.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full" disabled={!form.name || !form.url || form.events.length === 0}
                      onClick={() => createMutation.mutate()}>
                      إنشاء
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <NotificationsPopover />
            </div>
          </motion.header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-5xl mx-auto space-y-4">
              <Tabs defaultValue="endpoints" dir="rtl">
                <TabsList><TabsTrigger value="endpoints">نقاط النهاية</TabsTrigger><TabsTrigger value="logs">سجل التسليم</TabsTrigger></TabsList>

                <TabsContent value="endpoints" className="space-y-3 mt-4">
                  {webhooks.map((wh: any) => (
                    <Card key={wh.id} className="rounded-2xl">
                      <CardContent className="pt-4 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{wh.name}</h3>
                            <Badge variant={wh.is_active ? "default" : "secondary"} className="text-[10px]">{wh.is_active ? 'مفعّل' : 'معطّل'}</Badge>
                            {wh.failure_count > 0 && <Badge variant="destructive" className="text-[10px]">أخطاء: {wh.failure_count}</Badge>}
                          </div>
                          <code className="text-xs text-muted-foreground block truncate" dir="ltr">{wh.url}</code>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(wh.events || []).map((ev: string) => (
                              <Badge key={ev} variant="outline" className="text-[10px]">{ev}</Badge>
                            ))}
                          </div>
                          {wh.last_triggered_at && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              آخر تشغيل: {format(new Date(wh.last_triggered_at), 'dd MMM yyyy HH:mm', { locale: ar })}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLogsWebhookId(wh.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Switch checked={wh.is_active} onCheckedChange={v => toggleMutation.mutate({ id: wh.id, is_active: v })} />
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(wh.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!isLoading && webhooks.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Webhook className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">لا توجد Webhooks بعد</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="logs" className="space-y-2 mt-4">
                  {!logsWebhookId && <p className="text-sm text-muted-foreground text-center py-8">اختر Webhook من التبويب الأول لعرض سجلاته</p>}
                  {logs.map((log: any) => (
                    <div key={log.id} className="flex items-center gap-3 text-xs border rounded-xl px-3 py-2">
                      {log.success ? <CheckCircle className="h-4 w-4 text-success shrink-0" /> : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                      <Badge variant="outline" className="text-[10px]">{log.event_type}</Badge>
                      <span className="text-muted-foreground">{log.response_status || '—'}</span>
                      <span className="text-muted-foreground flex-1 truncate">{format(new Date(log.created_at), 'dd/MM HH:mm:ss')}</span>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
