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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Zap, Plus, Trash2, Play, ArrowDown, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const TRIGGER_EVENTS = [
  { value: 'ticket.created', label: 'عند إنشاء تذكرة' },
  { value: 'ticket.status_changed', label: 'عند تغيير الحالة' },
  { value: 'ticket.assigned', label: 'عند تعيين وكيل' },
  { value: 'ticket.priority_changed', label: 'عند تغيير الأولوية' },
];

const CONDITION_FIELDS = [
  { value: 'priority', label: 'الأولوية' },
  { value: 'status', label: 'الحالة' },
  { value: 'source_system', label: 'النظام المصدر' },
  { value: 'title', label: 'العنوان' },
];

const OPERATORS = [
  { value: 'equals', label: 'يساوي' },
  { value: 'not_equals', label: 'لا يساوي' },
  { value: 'contains', label: 'يحتوي على' },
];

const ACTION_TYPES = [
  { value: 'change_priority', label: 'تغيير الأولوية' },
  { value: 'change_status', label: 'تغيير الحالة' },
  { value: 'send_notification', label: 'إرسال إشعار' },
  { value: 'webhook', label: 'تشغيل Webhook' },
  { value: 'send_slack', label: 'إرسال لـ Slack' },
];

interface Condition { field: string; operator: string; value: string; }
interface Action { type: string; value?: string; message?: string; channel?: string; title?: string; }

export default function AdminAutomation() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState('');
  const [conditions, setConditions] = useState<Condition[]>([{ field: '', operator: 'equals', value: '' }]);
  const [actions, setActions] = useState<Action[]>([{ type: '' }]);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('automation_rules').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['automation-logs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('automation_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const validConditions = conditions.filter(c => c.field && c.value);
      const validActions = actions.filter(a => a.type);
      const { error } = await supabase.from('automation_rules').insert([{
        name,
        description: description || null,
        trigger_event: trigger,
        conditions: validConditions as any,
        actions: validActions as any,
        created_by: user!.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['automation-rules'] });
      setOpen(false);
      resetForm();
      toast({ title: 'تم إنشاء القاعدة ✅' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('automation_rules').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation-rules'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('automation_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({ title: 'تم الحذف' });
    },
  });

  const resetForm = () => {
    setName(''); setDescription(''); setTrigger('');
    setConditions([{ field: '', operator: 'equals', value: '' }]);
    setActions([{ type: '' }]);
  };

  const updateCondition = (i: number, key: keyof Condition, val: string) => {
    setConditions(c => c.map((item, idx) => idx === i ? { ...item, [key]: val } : item));
  };

  const updateAction = (i: number, key: string, val: string) => {
    setActions(a => a.map((item, idx) => idx === i ? { ...item, [key]: val } : item));
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
              <Zap className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">محرك الأتمتة</h1>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 ml-1" />قاعدة جديدة</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>إنشاء قاعدة أتمتة</DialogTitle></DialogHeader>
                  <div className="space-y-5 mt-2">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>اسم القاعدة</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: تصعيد التذاكر العاجلة" /></div>
                      <div><Label>الوصف</Label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="اختياري" /></div>
                    </div>

                    {/* Trigger */}
                    <div className="p-3 rounded-xl border bg-primary/5">
                      <Label className="text-xs font-bold text-primary mb-2 block">⚡ المحفّز (Trigger)</Label>
                      <Select value={trigger} onValueChange={setTrigger}>
                        <SelectTrigger><SelectValue placeholder="اختر الحدث" /></SelectTrigger>
                        <SelectContent>
                          {TRIGGER_EVENTS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <ArrowDown className="h-5 w-5 mx-auto text-muted-foreground" />

                    {/* Conditions */}
                    <div className="p-3 rounded-xl border bg-accent/30">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs font-bold">🔍 الشروط (Conditions)</Label>
                        <Button variant="ghost" size="sm" onClick={() => setConditions(c => [...c, { field: '', operator: 'equals', value: '' }])}>
                          <Plus className="h-3 w-3 ml-1" />شرط
                        </Button>
                      </div>
                      {conditions.map((cond, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                          <Select value={cond.field} onValueChange={v => updateCondition(i, 'field', v)}>
                            <SelectTrigger className="flex-1"><SelectValue placeholder="الحقل" /></SelectTrigger>
                            <SelectContent>{CONDITION_FIELDS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                          </Select>
                          <Select value={cond.operator} onValueChange={v => updateCondition(i, 'operator', v)}>
                            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                            <SelectContent>{OPERATORS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                          </Select>
                          <Input className="flex-1" value={cond.value} onChange={e => updateCondition(i, 'value', e.target.value)} placeholder="القيمة" />
                          {conditions.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setConditions(c => c.filter((_, idx) => idx !== i))}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <ArrowDown className="h-5 w-5 mx-auto text-muted-foreground" />

                    {/* Actions */}
                    <div className="p-3 rounded-xl border bg-success/5">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs font-bold text-success">🚀 الإجراءات (Actions)</Label>
                        <Button variant="ghost" size="sm" onClick={() => setActions(a => [...a, { type: '' }])}>
                          <Plus className="h-3 w-3 ml-1" />إجراء
                        </Button>
                      </div>
                      {actions.map((act, i) => (
                        <div key={i} className="mb-3 p-2 rounded-lg border bg-background">
                          <div className="flex items-center gap-2 mb-2">
                            <Select value={act.type} onValueChange={v => updateAction(i, 'type', v)}>
                              <SelectTrigger className="flex-1"><SelectValue placeholder="نوع الإجراء" /></SelectTrigger>
                              <SelectContent>{ACTION_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                            </Select>
                            {actions.length > 1 && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActions(a => a.filter((_, idx) => idx !== i))}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          {(act.type === 'change_priority' || act.type === 'change_status') && (
                            <Input value={act.value || ''} onChange={e => updateAction(i, 'value', e.target.value)}
                              placeholder={act.type === 'change_priority' ? 'low | medium | high | urgent' : 'new | open | in_progress | ...'} className="text-xs" />
                          )}
                          {act.type === 'send_notification' && (
                            <div className="space-y-2">
                              <Input value={act.title || ''} onChange={e => updateAction(i, 'title', e.target.value)} placeholder="عنوان الإشعار" className="text-xs" />
                              <Textarea value={act.message || ''} onChange={e => updateAction(i, 'message', e.target.value)} placeholder="نص الإشعار" className="text-xs" rows={2} />
                            </div>
                          )}
                          {act.type === 'send_slack' && (
                            <div className="space-y-2">
                              <Input value={act.channel || ''} onChange={e => updateAction(i, 'channel', e.target.value)} placeholder="#channel-name" dir="ltr" className="text-xs" />
                              <Textarea value={act.message || ''} onChange={e => updateAction(i, 'message', e.target.value)} placeholder="نص الرسالة" className="text-xs" rows={2} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button className="w-full" disabled={!name || !trigger || actions.every(a => !a.type)}
                      onClick={() => createMutation.mutate()}>
                      إنشاء القاعدة
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <NotificationsPopover />
            </div>
          </motion.header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-5xl mx-auto">
              <Tabs defaultValue="rules" dir="rtl">
                <TabsList><TabsTrigger value="rules">القواعد</TabsTrigger><TabsTrigger value="logs">سجل التنفيذ</TabsTrigger></TabsList>

                <TabsContent value="rules" className="space-y-3 mt-4">
                  {rules.map((rule: any) => (
                    <Card key={rule.id} className="rounded-2xl">
                      <CardContent className="pt-4 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Zap className="h-4 w-4 text-primary shrink-0" />
                            <h3 className="font-semibold text-sm">{rule.name}</h3>
                            <Badge variant={rule.is_active ? "default" : "secondary"} className="text-[10px]">{rule.is_active ? 'مفعّل' : 'معطّل'}</Badge>
                            <Badge variant="outline" className="text-[10px]">{TRIGGER_EVENTS.find(t => t.value === rule.trigger_event)?.label || rule.trigger_event}</Badge>
                          </div>
                          {rule.description && <p className="text-xs text-muted-foreground mb-1">{rule.description}</p>}
                          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                            <span>الشروط: {(rule.conditions as any[])?.length || 0}</span>
                            <span>الإجراءات: {(rule.actions as any[])?.length || 0}</span>
                            <span>تنفيذ: {rule.execution_count} مرة</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch checked={rule.is_active} onCheckedChange={v => toggleMutation.mutate({ id: rule.id, is_active: v })} />
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(rule.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!isLoading && rules.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">لا توجد قواعد أتمتة بعد</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="logs" className="space-y-2 mt-4">
                  {logs.map((log: any) => (
                    <div key={log.id} className="flex items-center gap-3 text-xs border rounded-xl px-3 py-2">
                      {log.success ? <CheckCircle className="h-4 w-4 text-success shrink-0" /> : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                      <Badge variant="outline" className="text-[10px]">{log.trigger_event}</Badge>
                      <span className="flex-1 truncate text-muted-foreground">{log.error_message || 'تم التنفيذ بنجاح'}</span>
                      <span className="text-muted-foreground">{format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ar })}</span>
                    </div>
                  ))}
                  {logs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">لا توجد سجلات بعد</p>}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
