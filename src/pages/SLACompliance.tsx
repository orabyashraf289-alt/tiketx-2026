import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, Clock, TrendingUp, TrendingDown, Loader2, Download, CalendarDays, Filter, AlertTriangle, CheckCircle, Timer } from 'lucide-react';
import { motion } from 'framer-motion';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { priorityLabels } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';

const COLORS = ['hsl(142, 71%, 45%)', 'hsl(0, 84%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(217, 91%, 60%)'];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } }),
};

const datePresets = [
  { label: 'آخر 7 أيام', getValue: () => { const to = new Date(); return { from: subDays(to, 7).toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }; } },
  { label: 'آخر 30 يوم', getValue: () => { const to = new Date(); return { from: subDays(to, 30).toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }; } },
  { label: 'آخر 90 يوم', getValue: () => { const to = new Date(); return { from: subDays(to, 90).toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }; } },
  { label: 'الكل', getValue: () => ({ from: '', to: '' }) },
];

async function fetchSLAData() {
  const [ticketsRes, servicesRes, departmentsRes] = await Promise.all([
    supabase.from('tickets').select('id, ticket_number, title, status, priority, created_at, resolved_at, sla_first_response_due_at, sla_resolution_due_at, first_response_at, service_id, department_id, assigned_agent_id, services(name, systems(name)), departments(name)'),
    supabase.from('services').select('id, name'),
    supabase.from('departments').select('id, name'),
  ]);
  return {
    tickets: ticketsRes.data || [],
    services: servicesRes.data || [],
    departments: departmentsRes.data || [],
  };
}

export default function SLACompliance() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activePreset, setActivePreset] = useState('الكل');

  const { data, isLoading } = useQuery({
    queryKey: ['sla-compliance'],
    queryFn: fetchSLAData,
  });

  const applyPreset = (preset: typeof datePresets[0]) => {
    const val = preset.getValue();
    setDateFrom(val.from);
    setDateTo(val.to);
    setActivePreset(preset.label);
  };

  const filteredTickets = useMemo(() => {
    if (!data) return [];
    return data.tickets.filter((t: any) => {
      if (!dateFrom && !dateTo) return true;
      const d = new Date(t.created_at);
      if (dateFrom && d < startOfDay(new Date(dateFrom))) return false;
      if (dateTo && d > endOfDay(new Date(dateTo))) return false;
      return true;
    });
  }, [data, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const withSLA = filteredTickets.filter((t: any) => t.sla_resolution_due_at);
    if (withSLA.length === 0) return null;

    const now = new Date();

    // Resolution SLA
    const resolvedWithSLA = withSLA.filter((t: any) => t.resolved_at);
    const resolutionMet = resolvedWithSLA.filter((t: any) => new Date(t.resolved_at) <= new Date(t.sla_resolution_due_at)).length;
    const resolutionBreached = resolvedWithSLA.length - resolutionMet;
    const overdue = withSLA.filter((t: any) => !t.resolved_at && new Date(t.sla_resolution_due_at) < now).length;

    // First Response SLA
    const withFR = withSLA.filter((t: any) => t.sla_first_response_due_at);
    const frResponded = withFR.filter((t: any) => t.first_response_at);
    const frMet = frResponded.filter((t: any) => new Date(t.first_response_at) <= new Date(t.sla_first_response_due_at)).length;

    const totalForCompliance = resolvedWithSLA.length || 1;
    const compliancePercent = Math.round((resolutionMet / totalForCompliance) * 100);
    const frCompliancePercent = frResponded.length > 0 ? Math.round((frMet / frResponded.length) * 100) : 100;

    // By Priority
    const byPriority: Record<string, { total: number; met: number; breached: number }> = {};
    withSLA.forEach((t: any) => {
      if (!byPriority[t.priority]) byPriority[t.priority] = { total: 0, met: 0, breached: 0 };
      byPriority[t.priority].total++;
      if (t.resolved_at) {
        if (new Date(t.resolved_at) <= new Date(t.sla_resolution_due_at)) byPriority[t.priority].met++;
        else byPriority[t.priority].breached++;
      } else if (new Date(t.sla_resolution_due_at) < now) {
        byPriority[t.priority].breached++;
      }
    });

    const priorityData = Object.entries(byPriority).map(([k, v]) => ({
      name: priorityLabels[k as keyof typeof priorityLabels] || k,
      الالتزام: v.total > 0 ? Math.round((v.met / v.total) * 100) : 0,
      التجاوز: v.breached,
      الإجمالي: v.total,
    }));

    // By Service
    const byService: Record<string, { name: string; total: number; met: number; breached: number }> = {};
    withSLA.forEach((t: any) => {
      const svcName = (t as any).services?.name || 'غير محدد';
      if (!byService[svcName]) byService[svcName] = { name: svcName, total: 0, met: 0, breached: 0 };
      byService[svcName].total++;
      if (t.resolved_at) {
        if (new Date(t.resolved_at) <= new Date(t.sla_resolution_due_at)) byService[svcName].met++;
        else byService[svcName].breached++;
      } else if (new Date(t.sla_resolution_due_at) < now) {
        byService[svcName].breached++;
      }
    });

    const serviceData = Object.values(byService).map(s => ({
      name: s.name,
      الالتزام: s.total > 0 ? Math.round((s.met / s.total) * 100) : 0,
      التجاوز: s.breached,
    }));

    // By Department
    const byDept: Record<string, { name: string; total: number; met: number; breached: number }> = {};
    withSLA.forEach((t: any) => {
      const deptName = (t as any).departments?.name || 'غير محدد';
      if (!byDept[deptName]) byDept[deptName] = { name: deptName, total: 0, met: 0, breached: 0 };
      byDept[deptName].total++;
      if (t.resolved_at) {
        if (new Date(t.resolved_at) <= new Date(t.sla_resolution_due_at)) byDept[deptName].met++;
        else byDept[deptName].breached++;
      } else if (new Date(t.sla_resolution_due_at) < now) {
        byDept[deptName].breached++;
      }
    });

    const deptData = Object.values(byDept).map(d => ({
      name: d.name,
      الالتزام: d.total > 0 ? Math.round((d.met / d.total) * 100) : 0,
      التجاوز: d.breached,
    }));

    // Trend
    const trendMap: Record<string, { date: string; compliance: number; breaches: number; total: number; met: number }> = {};
    withSLA.forEach((t: any) => {
      const day = t.created_at?.slice(0, 10);
      if (!day) return;
      if (!trendMap[day]) trendMap[day] = { date: day, compliance: 0, breaches: 0, total: 0, met: 0 };
      trendMap[day].total++;
      if (t.resolved_at) {
        if (new Date(t.resolved_at) <= new Date(t.sla_resolution_due_at)) trendMap[day].met++;
        else trendMap[day].breaches++;
      } else if (new Date(t.sla_resolution_due_at) < now) {
        trendMap[day].breaches++;
      }
    });
    Object.values(trendMap).forEach(d => {
      d.compliance = d.total > 0 ? Math.round((d.met / d.total) * 100) : 0;
    });
    const trend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    // Breached tickets list
    const breachedTickets = withSLA.filter((t: any) => {
      if (t.resolved_at) return new Date(t.resolved_at) > new Date(t.sla_resolution_due_at);
      return new Date(t.sla_resolution_due_at) < now;
    }).slice(0, 20);

    return {
      total: withSLA.length,
      compliancePercent,
      frCompliancePercent,
      resolutionMet,
      resolutionBreached,
      overdue,
      priorityData,
      serviceData,
      deptData,
      trend,
      breachedTickets,
    };
  }, [filteredTickets]);

  const handleExportCSV = () => {
    if (!filteredTickets.length) return;
    const headers = ['رقم التذكرة', 'العنوان', 'الأولوية', 'الحالة', 'موعد SLA', 'تاريخ الحل', 'النتيجة'];
    const rows = filteredTickets.filter((t: any) => t.sla_resolution_due_at).map((t: any) => {
      const met = t.resolved_at ? new Date(t.resolved_at) <= new Date(t.sla_resolution_due_at) : new Date(t.sla_resolution_due_at) >= new Date();
      return [t.ticket_number, `"${t.title}"`, t.priority, t.status, t.sla_resolution_due_at?.slice(0, 16), t.resolved_at?.slice(0, 16) || '', met ? 'ملتزم' : 'متجاوز'];
    });
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sla-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 gap-3 shrink-0 sticky top-0 z-30"
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">تقرير التزام SLA</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportCSV}>
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">تصدير CSV</span>
              </Button>
              <NotificationsPopover />
            </div>
          </motion.header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Date Filter */}
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Filter className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">فلتر الفترة الزمنية</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {datePresets.map(p => (
                        <Button key={p.label} variant={activePreset === p.label ? 'default' : 'outline'} size="sm" className="text-xs rounded-full" onClick={() => applyPreset(p)}>
                          {p.label}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-3 items-center">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                      <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActivePreset(''); }} className="h-8 text-xs w-36" dir="ltr" />
                      <span className="text-muted-foreground text-xs">إلى</span>
                      <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setActivePreset(''); }} className="h-8 text-xs w-36" dir="ltr" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : !stats ? (
                <Card><CardContent className="py-20 text-center text-muted-foreground">لا توجد تذاكر بسياسات SLA في هذه الفترة</CardContent></Card>
              ) : (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                      { icon: ShieldCheck, value: `${stats.compliancePercent}%`, label: 'نسبة التزام الحل', color: stats.compliancePercent >= 80 ? 'text-success' : 'text-destructive' },
                      { icon: Timer, value: `${stats.frCompliancePercent}%`, label: 'التزام أول رد', color: stats.frCompliancePercent >= 80 ? 'text-success' : 'text-destructive' },
                      { icon: CheckCircle, value: stats.resolutionMet, label: 'ملتزمة', color: 'text-success' },
                      { icon: ShieldAlert, value: stats.resolutionBreached, label: 'متجاوزة', color: 'text-destructive' },
                      { icon: AlertTriangle, value: stats.overdue, label: 'متأخرة حالياً', color: 'text-warning' },
                      { icon: Clock, value: stats.total, label: 'إجمالي بـ SLA', color: 'text-primary' },
                    ].map((kpi, i) => (
                      <motion.div key={i} custom={i + 1} variants={fadeUp} initial="hidden" animate="show">
                        <Card>
                          <CardContent className="pt-4 text-center">
                            <kpi.icon className={`h-5 w-5 mx-auto mb-1.5 ${kpi.color}`} />
                            <p className="text-2xl font-bold">{kpi.value}</p>
                            <p className="text-xs text-muted-foreground">{kpi.label}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* By Priority */}
                    <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show">
                      <Card>
                        <CardHeader><CardTitle className="text-sm">الالتزام حسب الأولوية</CardTitle></CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={stats.priorityData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                              <Tooltip />
                              <Legend wrapperStyle={{ fontSize: '11px' }} />
                              <Bar dataKey="الالتزام" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="التجاوز" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* By Service */}
                    {stats.serviceData.length > 0 && (
                      <motion.div custom={8} variants={fadeUp} initial="hidden" animate="show">
                        <Card>
                          <CardHeader><CardTitle className="text-sm">الالتزام حسب الخدمة</CardTitle></CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart data={stats.serviceData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                                <Tooltip />
                                <Bar dataKey="الالتزام" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </div>

                  {/* Dept + Trend */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {stats.deptData.length > 0 && (
                      <motion.div custom={9} variants={fadeUp} initial="hidden" animate="show">
                        <Card>
                          <CardHeader><CardTitle className="text-sm">الالتزام حسب القسم</CardTitle></CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart data={stats.deptData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <Bar dataKey="الالتزام" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="التجاوز" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {stats.trend.length > 1 && (
                      <motion.div custom={10} variants={fadeUp} initial="hidden" animate="show">
                        <Card>
                          <CardHeader><CardTitle className="text-sm">اتجاه الالتزام بمرور الوقت</CardTitle></CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <LineChart data={stats.trend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={v => v.slice(5)} />
                                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <Line type="monotone" dataKey="compliance" name="نسبة الالتزام %" stroke="hsl(142, 71%, 45%)" strokeWidth={2} />
                                <Line type="monotone" dataKey="breaches" name="التجاوزات" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </div>

                  {/* Breached Tickets Table */}
                  {stats.breachedTickets.length > 0 && (
                    <motion.div custom={11} variants={fadeUp} initial="hidden" animate="show">
                      <Card>
                        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-destructive" />التذاكر المتجاوزة لـ SLA</CardTitle></CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-right">الكود</TableHead>
                                  <TableHead className="text-right">العنوان</TableHead>
                                  <TableHead className="text-right">الأولوية</TableHead>
                                  <TableHead className="text-right">الحالة</TableHead>
                                  <TableHead className="text-right">موعد SLA</TableHead>
                                  <TableHead className="text-right">الخدمة</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {stats.breachedTickets.map((t: any) => (
                                  <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = `/tickets/${t.id}`}>
                                    <TableCell className="font-mono text-xs">#{t.ticket_number}</TableCell>
                                    <TableCell className="text-sm max-w-[200px] truncate">{t.title}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={cn('text-[10px]',
                                        t.priority === 'urgent' ? 'bg-destructive/15 text-destructive' :
                                        t.priority === 'high' ? 'bg-warning/15 text-warning' : 'bg-muted'
                                      )}>
                                        {priorityLabels[t.priority as keyof typeof priorityLabels]}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs">{t.status}</TableCell>
                                    <TableCell className="text-xs text-destructive">{t.sla_resolution_due_at?.slice(0, 16)}</TableCell>
                                    <TableCell className="text-xs">{(t as any).services?.name || '-'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
