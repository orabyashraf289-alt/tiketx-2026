import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Bell, BellRing, CheckCircle, Clock, TrendingDown,
  TrendingUp, Shield, Users, Zap, Settings, XCircle,
} from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useState } from 'react';

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

export default function SmartAlerts() {
  const [alertSettings, setAlertSettings] = useState({
    sla_breach: true,
    high_volume: true,
    response_time: true,
    csat_drop: true,
    integration_error: true,
    security_event: true,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['alerts-tickets'],
    queryFn: async () => {
      const { data } = await supabase.from('tickets').select('id, status, priority, created_at, sla_resolution_due_at, first_response_at, sla_first_response_due_at');
      return data || [];
    },
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ['alerts-integrations'],
    queryFn: async () => {
      const { data } = await supabase.from('integration_configs').select('*').eq('is_active', true);
      return data || [];
    },
  });

  // Generate alerts based on real data
  const generatedAlerts: Alert[] = [];
  const now = new Date();

  // SLA breach alerts
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

  // Upcoming SLA warnings
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

  // High urgent tickets
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

  // Integration errors
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

  // No response alerts
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

  // Info alert if everything is fine
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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <h1 className="text-lg font-bold text-foreground">التنبيهات الذكية</h1>
                <p className="text-xs text-muted-foreground">مراقبة مؤشرات الأداء والتنبيه الاستباقي</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {criticalCount > 0 && <Badge variant="destructive" className="animate-pulse">{criticalCount} حرجة</Badge>}
              {warningCount > 0 && <Badge className="bg-warning/10 text-warning">{warningCount} تحذيرات</Badge>}
              <NotificationsPopover />
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'تنبيهات حرجة', value: criticalCount, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
                { label: 'تحذيرات', value: warningCount, icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
                { label: 'خروقات SLA', value: slaBreaches.length, icon: Clock, color: 'text-destructive', bg: 'bg-destructive/10' },
                { label: 'تذاكر عاجلة مفتوحة', value: urgentOpen.length, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card>
                    <CardContent className="flex items-center gap-4 py-5">
                      <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

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
                    <motion.div key={alert.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                      <Card className={`border-2 ${config.border}`}>
                        <CardContent className="flex items-start gap-4 py-5">
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
                            <Button variant="outline" size="sm">تأكيد الاستلام</Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Alert Settings */}
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                  <Settings className="h-5 w-5 text-primary" /> إعدادات التنبيهات
                </h2>
                <Card>
                  <CardContent className="py-5 space-y-4">
                    {[
                      { key: 'sla_breach', label: 'خروقات SLA', icon: Shield },
                      { key: 'high_volume', label: 'حجم تذاكر مرتفع', icon: TrendingUp },
                      { key: 'response_time', label: 'تأخر الاستجابة الأولى', icon: Clock },
                      { key: 'csat_drop', label: 'انخفاض رضا العملاء', icon: TrendingDown },
                      { key: 'integration_error', label: 'أخطاء التكاملات', icon: Zap },
                      { key: 'security_event', label: 'أحداث أمنية', icon: Shield },
                    ].map(setting => (
                      <div key={setting.key} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                        <div className="flex items-center gap-3">
                          <setting.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{setting.label}</span>
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
        </main>
      </div>
    </SidebarProvider>
  );
}
