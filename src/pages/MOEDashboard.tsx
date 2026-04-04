import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { motion } from 'framer-motion';
import {
  Building2, Ticket, CheckCircle, Clock, AlertTriangle, TrendingUp, Users, Star,
  ShieldCheck, BarChart3,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function MOEDashboard() {
  // Tenants stats
  const { data: tenants = [] } = useQuery({
    queryKey: ['moe-tenants'],
    queryFn: async () => {
      const { data } = await supabase.from('tenants').select('*').eq('is_active', true);
      return data || [];
    },
  });

  // All tickets stats
  const { data: tickets = [] } = useQuery({
    queryKey: ['moe-tickets'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tickets')
        .select('id, status, priority, source_system, created_at, resolved_at, sla_resolution_due_at, department_id');
      return data || [];
    },
  });

  // Departments
  const { data: departments = [] } = useQuery({
    queryKey: ['moe-departments'],
    queryFn: async () => {
      const { data } = await supabase.from('departments').select('id, name');
      return data || [];
    },
  });

  // Ratings
  const { data: ratings = [] } = useQuery({
    queryKey: ['moe-ratings'],
    queryFn: async () => {
      const { data } = await supabase.from('ticket_ratings').select('rating');
      return data || [];
    },
  });

  const totalTickets = tickets.length;
  const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const open = tickets.filter(t => ['new', 'open', 'in_progress'].includes(t.status)).length;
  const slaBreaches = tickets.filter(t => t.sla_resolution_due_at && new Date(t.sla_resolution_due_at) < new Date() && !['resolved', 'closed'].includes(t.status)).length;
  const avgRating = ratings.length > 0 ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : '0';
  const resolutionRate = totalTickets > 0 ? ((resolved / totalTickets) * 100).toFixed(0) : '0';

  // By source system
  const bySource = tickets.reduce((acc: Record<string, number>, t) => {
    acc[t.source_system] = (acc[t.source_system] || 0) + 1;
    return acc;
  }, {});
  const sourceData = Object.entries(bySource).map(([name, value]) => ({ name, value }));

  // By priority
  const byPriority = tickets.reduce((acc: Record<string, number>, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {});
  const priorityData = Object.entries(byPriority).map(([name, value]) => ({ name, value }));

  // By department
  const byDept = tickets.reduce((acc: Record<string, number>, t) => {
    const dept = departments.find(d => d.id === t.department_id);
    const name = dept?.name || 'غير محدد';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const deptData = Object.entries(byDept).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  // Weekly trend (last 8 weeks)
  const weeklyTrend = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (7 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const count = tickets.filter(t => {
      const d = new Date(t.created_at);
      return d >= weekStart && d < weekEnd;
    }).length;
    return { week: `أسبوع ${i + 1}`, tickets: count };
  });

  const kpis = [
    { label: 'إجمالي التذاكر', value: totalTickets, icon: Ticket, color: 'text-primary' },
    { label: 'التذاكر المفتوحة', value: open, icon: Clock, color: 'text-warning' },
    { label: 'التذاكر المحلولة', value: resolved, icon: CheckCircle, color: 'text-success' },
    { label: 'خروقات SLA', value: slaBreaches, icon: AlertTriangle, color: 'text-destructive' },
    { label: 'نسبة الحل', value: `${resolutionRate}%`, icon: TrendingUp, color: 'text-primary' },
    { label: 'متوسط التقييم', value: avgRating, icon: Star, color: 'text-warning' },
    { label: 'المستأجرون النشطون', value: tenants.length, icon: Building2, color: 'text-info' },
    { label: 'الأقسام', value: departments.length, icon: Users, color: 'text-muted-foreground' },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <motion.header
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 gap-3 shrink-0 sticky top-0 z-30"
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">لوحة مراقبة وزارة التعليم</h1>
            </div>
            <NotificationsPopover />
          </motion.header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {kpis.map((kpi, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="rounded-2xl">
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                          </div>
                          <kpi.icon className={`h-5 w-5 ${kpi.color} opacity-50`} />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">التذاكر حسب المصدر</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={sourceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">التذاكر حسب الأولوية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={priorityData}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">اتجاه التذاكر الأسبوعي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={weeklyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="tickets" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">التذاكر حسب القسم</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={deptData} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Tenants Table */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    المؤسسات المسجلة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">المؤسسة</th>
                          <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">الخطة</th>
                          <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">المستخدمون</th>
                          <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">التذاكر/شهر</th>
                          <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenants.map((t: any) => (
                          <tr key={t.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-2.5 px-3 font-medium">{t.name}</td>
                            <td className="py-2.5 px-3">
                              <Badge variant="outline" className="text-[10px]">{t.plan}</Badge>
                            </td>
                            <td className="py-2.5 px-3">{t.max_users || '-'}</td>
                            <td className="py-2.5 px-3">{t.max_tickets_per_month || '-'}</td>
                            <td className="py-2.5 px-3">
                              <Badge className={`text-[10px] ${t.is_active ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'} border-0`}>
                                {t.is_active ? 'نشط' : 'معطل'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
