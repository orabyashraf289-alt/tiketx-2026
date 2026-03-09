import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent } from '@/components/ui/card';
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
import { Webhook, Plus, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useLanguage } from '@/i18n';

export default function AdminWebhooks() {
  const { t, isRTL, lang } = useLanguage();
  const dateLocale = lang === 'ar' ? ar : enUS;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [logsWebhookId, setLogsWebhookId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', url: '', secret: '', events: [] as string[] });

  const EVENT_TYPES = [
    { value: 'ticket.created', label: t.admin.webhookEventsList.ticketCreated },
    { value: 'ticket.status_changed', label: t.admin.webhookEventsList.statusChanged },
    { value: 'ticket.assigned', label: t.admin.webhookEventsList.assigned },
    { value: 'ticket.priority_changed', label: t.admin.webhookEventsList.priorityChanged },
    { value: 'ticket.comment_added', label: t.admin.webhookEventsList.commentAdded },
    { value: 'ticket.resolved', label: t.admin.webhookEventsList.resolved },
    { value: 'ticket.closed', label: t.admin.webhookEventsList.closed },
  ];

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
      toast({ title: t.admin.webhookCreated });
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
      toast({ title: t.admin.webhookDeleted });
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
              <h1 className="text-lg font-bold">{t.admin.webhooksTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />{t.admin.addWebhook}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
                  <DialogHeader><DialogTitle>{t.admin.addWebhook}</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div><Label>{t.admin.webhookName}</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t.admin.webhookNamePlaceholder} /></div>
                    <div><Label>{t.admin.webhookUrl}</Label><Input dir="ltr" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder={t.admin.webhookUrlPlaceholder} /></div>
                    <div><Label>{t.admin.webhookSecret}</Label><Input dir="ltr" value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))} placeholder={t.admin.webhookSecretPlaceholder} /></div>
                    <div>
                      <Label className="mb-2 block">{t.admin.webhookEventsLabel}</Label>
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
                      {t.admin.createWebhook}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <NotificationsPopover />
            </div>
          </motion.header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-5xl mx-auto space-y-4">
              <Tabs defaultValue="endpoints" dir={isRTL ? 'rtl' : 'ltr'}>
                <TabsList><TabsTrigger value="endpoints">{t.admin.endpointsTab}</TabsTrigger><TabsTrigger value="logs">{t.admin.deliveryLogsTab}</TabsTrigger></TabsList>

                <TabsContent value="endpoints" className="space-y-3 mt-4">
                  {webhooks.map((wh: any) => (
                    <Card key={wh.id} className="rounded-2xl">
                      <CardContent className="pt-4 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{wh.name}</h3>
                            <Badge variant={wh.is_active ? "default" : "secondary"} className="text-[10px]">{wh.is_active ? t.admin.webhookActive : t.admin.webhookInactive}</Badge>
                            {wh.failure_count > 0 && <Badge variant="destructive" className="text-[10px]">{t.admin.failureCount}: {wh.failure_count}</Badge>}
                          </div>
                          <code className="text-xs text-muted-foreground block truncate" dir="ltr">{wh.url}</code>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(wh.events || []).map((ev: string) => (
                              <Badge key={ev} variant="outline" className="text-[10px]">{ev}</Badge>
                            ))}
                          </div>
                          {wh.last_triggered_at && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {t.admin.lastTriggered}: {format(new Date(wh.last_triggered_at), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
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
                      <p className="text-sm">{t.admin.noWebhooks}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="logs" className="space-y-2 mt-4">
                  {!logsWebhookId && <p className="text-sm text-muted-foreground text-center py-8">{t.admin.selectWebhookFirst}</p>}
                  {logs.map((log: any) => (
                    <div key={log.id} className="flex items-center gap-3 text-xs border rounded-xl px-3 py-2">
                      {log.success ? <CheckCircle className="h-4 w-4 text-success shrink-0" /> : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                      <Badge variant="outline" className="text-[10px]">{log.event_type}</Badge>
                      <span className="text-muted-foreground">{log.response_status || '—'}</span>
                      <span className="text-muted-foreground flex-1 truncate">{format(new Date(log.created_at), 'dd/MM HH:mm:ss', { locale: dateLocale })}</span>
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
