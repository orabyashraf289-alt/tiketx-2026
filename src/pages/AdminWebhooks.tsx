import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageLayout, PageHeader } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Webhook, Plus, Trash2, Eye, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useLanguage } from '@/i18n';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function AdminWebhooks() {
  const { t, isRTL, lang } = useLanguage();
  const dateLocale = lang === 'ar' ? ar : enUS;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [logsWebhookId, setLogsWebhookId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', url: '', secret: '', events: [] as string[] });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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
      setDeleteTarget(null);
    },
  });

  const toggleEvent = (ev: string) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(ev) ? f.events.filter(e => e !== ev) : [...f.events, ev],
    }));
  };

  const addDialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-accent text-accent-foreground gap-2 text-sm shadow-lg shadow-primary/20 rounded-xl">
          <Plus className="h-4 w-4" />{t.admin.addWebhook}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader><DialogTitle>{t.admin.addWebhook}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t.admin.webhookName}</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t.admin.webhookNamePlaceholder} className="rounded-xl h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t.admin.webhookUrl}</Label>
            <Input dir="ltr" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder={t.admin.webhookUrlPlaceholder} className="rounded-xl h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t.admin.webhookSecret}</Label>
            <Input dir="ltr" value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))} placeholder={t.admin.webhookSecretPlaceholder} className="rounded-xl h-9" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t.admin.webhookEventsLabel}</Label>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map(ev => (
                <label key={ev.value} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox checked={form.events.includes(ev.value)} onCheckedChange={() => toggleEvent(ev.value)} />
                  {ev.label}
                </label>
              ))}
            </div>
          </div>
          <Button className="w-full gradient-accent text-accent-foreground rounded-xl" disabled={!form.name || !form.url || form.events.length === 0 || createMutation.isPending}
            onClick={() => createMutation.mutate()}>
            {createMutation.isPending && <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />}
            {t.admin.createWebhook}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <PageLayout>
      <PageHeader
        title={t.admin.webhooksTitle}
        icon={<Webhook className="h-5 w-5" />}
        actions={addDialog}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }} initial="hidden" animate="visible" className="max-w-4xl mx-auto">
          <Tabs defaultValue="endpoints" dir={isRTL ? 'rtl' : 'ltr'}>
            <TabsList className="mb-4">
              <TabsTrigger value="endpoints">{t.admin.endpointsTab}</TabsTrigger>
              <TabsTrigger value="logs">{t.admin.deliveryLogsTab}</TabsTrigger>
            </TabsList>

            <TabsContent value="endpoints" className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : webhooks.length === 0 ? (
                <motion.div variants={fadeUp} className="text-center py-16 text-muted-foreground">
                  <Webhook className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t.admin.noWebhooks}</p>
                </motion.div>
              ) : (
                webhooks.map((wh: any, i: number) => (
                  <motion.div key={wh.id} variants={fadeUp} custom={i}>
                    <Card className="rounded-2xl border-border/50 shadow-card group">
                      <CardContent className="pt-4 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{wh.name}</h3>
                            <Badge variant={wh.is_active ? "default" : "secondary"} className="text-[10px] rounded-lg">
                              {wh.is_active ? t.admin.webhookActive : t.admin.webhookInactive}
                            </Badge>
                            {wh.failure_count > 0 && (
                              <Badge variant="destructive" className="text-[10px] rounded-lg">
                                {t.admin.failureCount}: {wh.failure_count}
                              </Badge>
                            )}
                          </div>
                          <code className="text-xs text-muted-foreground block truncate" dir="ltr">{wh.url}</code>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(wh.events || []).map((ev: string) => (
                              <Badge key={ev} variant="outline" className="text-[10px] rounded-lg">{ev}</Badge>
                            ))}
                          </div>
                          {wh.last_triggered_at && (
                            <p className="text-[10px] text-muted-foreground mt-1.5">
                              {t.admin.lastTriggered}: {format(new Date(wh.last_triggered_at), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                            </p>
                          )}
                        </div>
                        <TooltipProvider delayDuration={200}>
                          <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setLogsWebhookId(wh.id)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">{t.admin.deliveryLogsTab}</TooltipContent>
                            </Tooltip>
                            <Switch checked={wh.is_active} onCheckedChange={v => toggleMutation.mutate({ id: wh.id, is_active: v })} />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => setDeleteTarget(wh.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">{t.common.delete}</TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </TabsContent>

            <TabsContent value="logs" className="space-y-2">
              {!logsWebhookId ? (
                <p className="text-sm text-muted-foreground text-center py-12">{t.admin.selectWebhookFirst}</p>
              ) : (
                logs.map((log: any) => (
                  <motion.div key={log.id} variants={fadeUp} className="flex items-center gap-3 text-xs border rounded-xl px-3 py-2.5 hover:bg-muted/30 transition-colors">
                    {log.success ? <CheckCircle className="h-4 w-4 text-success shrink-0" /> : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                    <Badge variant="outline" className="text-[10px] rounded-lg">{log.event_type}</Badge>
                    <span className="text-muted-foreground">{log.response_status || '—'}</span>
                    <span className="text-muted-foreground flex-1 truncate">{format(new Date(log.created_at), 'dd/MM HH:mm:ss', { locale: dateLocale })}</span>
                  </motion.div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.admin.deleteWebhookConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{t.admin.deleteWebhookDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
