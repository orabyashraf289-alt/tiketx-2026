import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { motion } from 'framer-motion';
import {
  TrendingUp, Brain, BarChart3, Target, Calendar, Zap,
  ArrowUp, ArrowDown, Activity, Clock,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart,
  Area, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval, subWeeks, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function PredictiveAnalytics() {
  const { data: tickets = [] } = useQuery({
    queryKey: ['predict-tickets'],
    queryFn: async () => {
      const since = subDays(new Date(), 90).toISOString();
      const { data } = await supabase.from('tickets')
        .select('id, status, priority, created_at, resolved_at, first_response_at, sla_resolution_due_at, sla_first_response_due_at, department_id, source_system')
        .gte('created_at', since);
      return data || [];
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['predict-departments'],
    queryFn: async () => {
      const { data } = await supabase.from('departments').select('id, name');
      return data || [];
    },
  });

  // --- Calculate historical daily volumes ---
  const last30Days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
  const dailyVolumes = last30Days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const count = tickets.filter(t => format(new Date(t.created_at), 'yyyy-MM-dd') === dayStr).length;
    return { date: format(day, 'dd/MM'), count, day: format(day, 'EEEE', { locale: ar }) };
  });

  // --- Simple linear regression forecast ---
  const recentAvg = dailyVolumes.slice(-14).reduce((s, d) => s + d.count, 0) / 14;
  const olderAvg = dailyVolumes.slice(0, 14).reduce((s, d) => s + d.count, 0) / 14;
  const trend = (recentAvg - olderAvg) / 14;

  const forecastDays = Array.from({ length: 14 }, (_, i) => ({
    date: format(addDays(new Date(), i + 1), 'dd/MM'),
    predicted: Math.max(0, Math.round(recentAvg + trend * (i + 1))),
    lower: Math.max(0, Math.round((recentAvg + trend * (i + 1)) * 0.7)),
    upper: Math.round((recentAvg + trend * (i + 1)) * 1.3),
  }));

  // --- Priority distribution ---
  const priorityDist = ['urgent', 'high', 'medium', 'low'].map(p => ({
    name: p === 'urgent' ? 'عاجلة' : p === 'high' ? 'عالية' : p === 'medium' ? 'متوسطة' : 'منخفضة',
    value: tickets.filter(t => t.priority === p).length,
  }));

  // --- Source system distribution ---
  const sourceDist = Object.entries(
    tickets.reduce<Record<string, number>>((acc, t) => {
      acc[t.source_system] = (acc[t.source_system] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // --- SLA compliance trend ---
  const weeklyCompliance = Array.from({ length: 8 }, (_, i) => {
    const weekStart = subWeeks(new Date(), 7 - i);
    const weekEnd = subWeeks(new Date(), 6 - i);
    const weekTickets = tickets.filter(t => {
      const d = new Date(t.created_at);
      return d >= weekStart && d < weekEnd;
    });
    const breached = weekTickets.filter(t =>
      t.sla_resolution_due_at && t.resolved_at && new Date(t.resolved_at) > new Date(t.sla_resolution_due_at)
    ).length;
    const total = weekTickets.length || 1;
    return {
      week: `W${8 - i}`,
      compliance: Math.round(((total - breached) / total) * 100),
    };
  });

  // --- Department workload radar ---
  const deptWorkload = departments.slice(0, 6).map(dept => ({
    department: dept.name.slice(0, 15),
    tickets: tickets.filter(t => t.department_id === dept.id).length,
    resolved: tickets.filter(t => t.department_id === dept.id && ['resolved', 'closed'].includes(t.status)).length,
  }));

  // --- Resolution time analysis ---
  const resolvedTickets = tickets.filter(t => t.resolved_at && t.created_at);
  const avgResolutionHours = resolvedTickets.length > 0
    ? Math.round(resolvedTickets.reduce((s, t) => s + (new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime()) / 3600000, 0) / resolvedTickets.length)
    : 0;

  const avgResponseHours = tickets.filter(t => t.first_response_at).length > 0
    ? Math.round(tickets.filter(t => t.first_response_at).reduce((s, t) => s + (new Date(t.first_response_at!).getTime() - new Date(t.created_at).getTime()) / 3600000, 0) / tickets.filter(t => t.first_response_at).length)
    : 0;

  const trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <h1 className="text-lg font-bold text-foreground">التحليلات التنبؤية</h1>
                <p className="text-xs text-muted-foreground">توقعات ذكية مبنية على بيانات آخر 90 يوماً</p>
              </div>
            </div>
            <NotificationsPopover />
          </header>

          <div className="p-6 space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { label: 'إجمالي التذاكر (90 يوم)', value: tickets.length, icon: BarChart3, color: 'text-primary' },
                { label: 'المعدل اليومي', value: Math.round(recentAvg), icon: Activity, color: 'text-info', trend: trendDirection },
                { label: 'متوسط وقت الحل', value: `${avgResolutionHours}h`, icon: Clock, color: 'text-warning' },
                { label: 'متوسط الاستجابة الأولى', value: `${avgResponseHours}h`, icon: Zap, color: 'text-success' },
                { label: 'التوقع (أسبوعين)', value: forecastDays.reduce((s, d) => s + d.predicted, 0), icon: Brain, color: 'text-primary' },
              ].map((kpi, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card>
                    <CardContent className="py-5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-muted/50"><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
                        {'trend' in kpi && kpi.trend && (
                          kpi.trend === 'up' ? <ArrowUp className="h-4 w-4 text-destructive" /> : <ArrowDown className="h-4 w-4 text-success" />
                        )}
                      </div>
                      <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Forecast Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> التوقعات للأسبوعين القادمين</CardTitle>
                <CardDescription>نطاق الثقة يعكس التباين المتوقع بناءً على الأنماط التاريخية</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={[...dailyVolumes.slice(-14).map(d => ({ date: d.date, actual: d.count })), ...forecastDays.map(d => ({ date: d.date, predicted: d.predicted, lower: d.lower, upper: d.upper }))]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.1} name="الحد الأعلى" />
                    <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(var(--background))" fillOpacity={1} name="الحد الأدنى" />
                    <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="فعلي" />
                    <Line type="monotone" dataKey="predicted" stroke="hsl(var(--chart-2))" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="متوقع" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Historical Trend */}
              <Card>
                <CardHeader><CardTitle className="text-sm">الحجم اليومي (30 يوم)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dailyVolumes}>
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={2} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="التذاكر" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* SLA Compliance Trend */}
              <Card>
                <CardHeader><CardTitle className="text-sm">اتجاه التزام SLA (أسبوعي)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={weeklyCompliance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="compliance" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 4 }} name="% الالتزام" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Priority Distribution */}
              <Card>
                <CardHeader><CardTitle className="text-sm">توزيع الأولويات</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={priorityDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {priorityDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Source System Distribution */}
              <Card>
                <CardHeader><CardTitle className="text-sm">مصادر التذاكر</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sourceDist} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name="التذاكر" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Department Workload Radar */}
            {deptWorkload.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> حمل العمل حسب القسم</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={deptWorkload}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="department" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis tick={{ fontSize: 10 }} />
                      <Radar name="التذاكر" dataKey="tickets" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                      <Radar name="المحلولة" dataKey="resolved" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.2} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
