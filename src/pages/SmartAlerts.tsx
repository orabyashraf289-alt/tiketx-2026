import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageLayout, PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import {
  AlertTriangle, BellRing, CheckCircle, Clock, TrendingDown,
  TrendingUp, Shield, Zap, Settings, XCircle, Activity,
  ArrowUpRight, RefreshCw, Radio,
} from 'lucide-react';
import { differenceInHours, differenceInMinutes, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  acknowledged: boolean;
  metric?: string;
  threshold?: string;
  current?: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function SmartAlerts() {
  const [alertSettings, setAlertSettings] = useState({
    sla_breach: true,
    high_volume: true,
    response_time: true,
    csat_drop: true,
    integration_error: true,
    security_event: true,
  });
  const [liveFeed, setLiveFeed] = useState<Array<{ id: string; text: string; time: string; type: string }>>([]);
  const [isEscalating, setIsEscalating] = useState(false);

  const { data: tickets = [], refetch: refetchTickets } = useQuery({
    queryKey: ['alerts-tickets'],
    queryFn: async () => {
      const { data } = await supabase.from('tickets').select('id, ticket_number, status, priority, created_at, sla_resolution_due_at, first_response_at, sla_first_response_due_at, title');
      return data || [];
    },
    refetchInterval: 30000,
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ['alerts-integrations'],
    queryFn: async () => {
      const { data } = await supabase.from('integration_configs').select('*').eq('is_active', true);
      return data || [];
    },
  });

  const { data: recentNotifications = [] } = useQuery({
    queryKey: ['alerts-recent-notifications'],
    queryFn: async () => {
      const { data } = await supabase.from('notifications').select('id, title, message, created_at, type').order('created_at', { ascending: false }).limit(20);
      return data || [];
    },
    refetchInterval: 15000,
  });

  // Realtime subscription for live feed
  useEffect(() => {
    const channel = supabase
      .channel('smart-alerts-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload) => {
        const newItem = {
          id: crypto.randomUUID(),
          text: payload.eventType === 'INSERT' 
            ? `تذكرة جديدة: ${(payload.new as any)?.title?.substring(0, 40) || '#' + (payload.new as any)?.ticket_number}`
            : `تحديث تذكرة #${(payload.new as any)?.ticket_number}: ${(payload.new as any)?.status}`,
          time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          type: payload.eventType === 'INSERT' ? 'new' : 'update',
        };
        setLiveFeed(prev => [newItem, ...prev].slice(0, 15));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const newItem = {
          id: crypto.randomUUID(),
          text: (payload.new as any)?.title || 'إشعار جديد',
          time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          type: 'notification',
        };
        setLiveFeed(prev => [newItem, ...prev].slice(0, 15));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Trigger auto-escalation
  const handleAutoEscalate = async () => {
    setIsEscalating(true);
    try {
      const { data, error } = await supabase.functions.invoke('sla-auto-escalate');
      if (error) throw error;
      toast.success(`تم تصعيد ${data?.escalated || 0} تذكرة تلقائياً`);
      refetchTickets();
    } catch (err) {
      toast.error('فشل في تشغيل التصعيد التلقائي');
    } finally {
      setIsEscalating(false);
    }
  };

  const now = new Date();
  const generatedAlerts: Alert[] = [];

  const slaBreaches = tickets.filter(t =>
    t.sla_resolution_due_at &&
    new Date(t.sla_resolution_due_at) < now &&
    !['resolved', 'closed'].includes(t.status)
  );
  if (slaBreaches.length > 0) {
    generatedAlerts.push({
      id: 'sla-breach',
      type: 'critical',
      title: `${slaBreaches.length} تذاكر تجاوزت SLA`,
      description: `يوجد ${slaBreaches.length} تذكرة تجاوزت مهلة الحل المحددة في اتفاقية مستوى الخدمة`,
      timestamp: now,
      acknowledged: false,
      metric: 'خروقات SLA',
      threshold: '0',
      current: String(slaBreaches.length),
    });
  }

  const slaWarnings = tickets.filter(t => {
    if (!t.sla_resolution_due_at || ['resolved', 'closed'].includes(t.status)) return false;
    const hoursLeft = differenceInHours(new Date(t.sla_resolution_due_at), now);
    return hoursLeft > 0 && hoursLeft <= 2;
  });
  if (slaWarnings.length > 0) {
    generatedAlerts.push({
      id: 'sla-warning',
      type: 'warning',
      title: `${slaWarnings.length} تذاكر على وشك تجاوز SLA`,
      description: `${slaWarnings.length} تذكرة ستتجاوز مهلة SLA خلال الساعتين القادمتين`,
      timestamp: now,
      acknowledged: false,
      metric: 'تحذيرات SLA',
      current: String(slaWarnings.length),
    });
  }

  const urgentOpen = tickets.filter(t => t.priority === 'urgent' && !['resolved', 'closed'].includes(t.status));
  if (urgentOpen.length >= 3) {
    generatedAlerts.push({
      id: 'urgent-volume',
      type: 'critical',
      title: 'حجم مرتفع من التذاكر العاجلة',
      description: `يوجد ${urgentOpen.length} تذاكر بأولوية عاجلة مفتوحة حالياً`,
      timestamp: now,
      acknowledged: false,
      metric: 'التذاكر العاجلة',
      threshold: '2',
      current: String(urgentOpen.length),
    });
  }

  const errorIntegrations = integrations.filter(i => i.error_message);
  if (errorIntegrations.length > 0) {
    generatedAlerts.push({
      id: 'integration-error',
      type: 'warning',
      title: 'أخطاء في التكاملات الخارجية',
      description: `${errorIntegrations.length} تكامل يعاني من مشاكل: ${errorIntegrations.map(i => i.module_name).join('، ')}`,
      timestamp: now,
      acknowledged: false,
    });
  }

  const noResponse = tickets.filter(t =>
    !t.first_response_at &&
    t.sla_first_response_due_at &&
    new Date(t.sla_first_response_due_at) < now &&
    !['resolved', 'closed'].includes(t.status)
  );
  if (noResponse.length > 0) {
    generatedAlerts.push({
      id: 'no-response',
      type: 'critical',
      title: `${noResponse.length} تذاكر بدون استجابة أولى`,
      description: 'تذاكر تجاوزت مهلة الاستجابة الأولى ولم يتم الرد عليها بعد',
      timestamp: now,
      acknowledged: false,
    });
  }

  if (generatedAlerts.length === 0) {
    generatedAlerts.push({
      id: 'all-good',
      type: 'info',
      title: 'لا توجد تنبيهات حالياً',
      description: 'جميع المؤشرات ضمن الحدود الطبيعية. استمر في المتابعة.',
      timestamp: now,
      acknowledged: true,
    });
  }

  const alertTypeConfig: Record<string, { icon: any; color: string; bg: string; border: string }> = {
    critical: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
    warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
    info: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
  };

  const criticalCount = generatedAlerts.filter(a => a.type === 'critical').length;
  const warningCount = generatedAlerts.filter(a => a.type === 'warning').length;

  const feedTypeIcons: Record<string, { icon: any; color: string }> = {
    new: { icon: ArrowUpRight, color: 'text-success' },
    update: { icon: RefreshCw, color: 'text-info' },
    notification: { icon: BellRing, color: 'text-warning' },
  };

  return (
    <PageLayout>
      <PageHeader title="التنبيهات الذكية" icon={<BellRing className="h-5 w-5" />} />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="max-w-7xl mx-auto space-y-6">

          {/* Summary Cards */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'تنبيهات حرجة', value: criticalCount, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
              { label: 'تحذيرات', value: warningCount, icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
              { label: 'خروقات SLA', value: slaBreaches.length, icon: Clock, color: 'text-destructive', bg: 'bg-destructive/10' },
              { label: 'تذاكر عاجلة', value: urgentOpen.length, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'بدون استجابة', value: noResponse.length, icon: Shield, color: 'text-warning', bg: 'bg-warning/10' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="rounded-2xl border-border/50 shadow-card">
                  <CardContent className="flex items-center gap-3 py-4 px-4">
                    <div className={`p-2 rounded-xl ${stat.bg}`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Auto-Escalation Action */}
          {slaBreaches.length > 0 && (
            <motion.div variants={fadeUp}>
              <Card className="rounded-2xl border-2 border-destructive/30 bg-destructive/5">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-destructive/10">
                      <Zap className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">تصعيد تلقائي متاح</h3>
                      <p className="text-xs text-muted-foreground">{slaBreaches.length} تذكرة تجاوزت SLA - يمكن تصعيد الأولوية تلقائياً وإشعار المدراء</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleAutoEscalate} 
                    disabled={isEscalating}
                    variant="destructive"
                    className="gap-2 rounded-xl"
                  >
                    {isEscalating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    تصعيد الآن
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Alerts */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" /> التنبيهات النشطة
              </h2>
              {generatedAlerts.map((alert, i) => {
                const config = alertTypeConfig[alert.type];
                const Icon = config.icon;
                return (
                  <motion.div key={alert.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <Card className={`rounded-2xl border-2 ${config.border}`}>
                      <CardContent className="flex items-start gap-4 py-4">
                        <div className={`p-2.5 rounded-xl ${config.bg} shrink-0`}>
                          <Icon className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{alert.title}</h3>
                            <Badge className={`${config.bg} ${config.color} text-xs`}>
                              {alert.type === 'critical' ? 'حرج' : alert.type === 'warning' ? 'تحذير' : 'معلومة'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                          {alert.metric && (
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              {alert.threshold && <span>الحد: {alert.threshold}</span>}
                              {alert.current && <span>الحالي: <strong className={config.color}>{alert.current}</strong></span>}
                            </div>
                          )}
                        </div>
                        {alert.type !== 'info' && (
                          <Button variant="outline" size="sm" className="rounded-xl shrink-0">تأكيد</Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Live Feed */}
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
                  <Radio className="h-4 w-4 text-success animate-pulse" /> البث المباشر
                </h2>
                <Card className="rounded-2xl border-border/50 shadow-card">
                  <CardContent className="p-0 max-h-64 overflow-auto custom-scrollbar">
                    {liveFeed.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                        في انتظار أحداث جديدة...
                      </div>
                    ) : (
                      <div className="divide-y divide-border/40">
                        {liveFeed.map((item) => {
                          const feedConfig = feedTypeIcons[item.type] || feedTypeIcons.update;
                          const FeedIcon = feedConfig.icon;
                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-2.5 p-3 hover:bg-muted/30 transition-colors"
                            >
                              <FeedIcon className={`h-3.5 w-3.5 shrink-0 ${feedConfig.color}`} />
                              <span className="text-xs text-foreground flex-1 truncate">{item.text}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Alert Settings */}
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
                  <Settings className="h-4 w-4 text-primary" /> إعدادات التنبيهات
                </h2>
                <Card className="rounded-2xl border-border/50 shadow-card">
                  <CardContent className="py-4 space-y-3">
                    {[
                      { key: 'sla_breach', label: 'خروقات SLA', icon: Shield },
                      { key: 'high_volume', label: 'حجم تذاكر مرتفع', icon: TrendingUp },
                      { key: 'response_time', label: 'تأخر الاستجابة', icon: Clock },
                      { key: 'csat_drop', label: 'انخفاض رضا العملاء', icon: TrendingDown },
                      { key: 'integration_error', label: 'أخطاء التكاملات', icon: Zap },
                      { key: 'security_event', label: 'أحداث أمنية', icon: Shield },
                    ].map(setting => (
                      <div key={setting.key} className="flex items-center justify-between p-2.5 rounded-xl border border-border/50">
                        <div className="flex items-center gap-2.5">
                          <setting.icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground">{setting.label}</span>
                        </div>
                        <Switch
                          checked={alertSettings[setting.key as keyof typeof alertSettings]}
                          onCheckedChange={(checked) => setAlertSettings(prev => ({ ...prev, [setting.key]: checked }))}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </PageLayout>
  );
}
