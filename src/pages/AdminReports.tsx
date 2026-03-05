import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchReportData, statusLabels, priorityLabels } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BarChart3, Clock, ShieldCheck, AlertTriangle, Download, Timer, Printer, CalendarDays, Filter, TrendingUp, TrendingDown, FileText, Building2, Monitor, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { exportReportPDF } from '@/components/ReportPDFExport';

const COLORS = ['hsl(217, 72%, 50%)', 'hsl(222, 60%, 42%)', 'hsl(38, 92%, 50%)', 'hsl(199, 89%, 48%)', 'hsl(0, 72%, 51%)', 'hsl(280, 60%, 50%)', 'hsl(152, 55%, 42%)'];

function downloadCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    '\uFEFF' + headers.join(','),
    ...data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } }),
};

// Quick date range presets
const datePresets = [
  { label: 'اليوم', getValue: () => { const d = new Date().toISOString().slice(0, 10); return { from: d, to: d }; } },
  { label: 'آخر 7 أيام', getValue: () => { const to = new Date(); const from = new Date(to); from.setDate(from.getDate() - 7); return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }; } },
  { label: 'آخر 30 يوم', getValue: () => { const to = new Date(); const from = new Date(to); from.setDate(from.getDate() - 30); return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }; } },
  { label: 'آخر 90 يوم', getValue: () => { const to = new Date(); const from = new Date(to); from.setDate(from.getDate() - 90); return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }; } },
  { label: 'الكل', getValue: () => ({ from: '', to: '' }) },
];

export default function AdminReports() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activePreset, setActivePreset] = useState('الكل');
  const [filterDept, setFilterDept] = useState('all');
  const [filterSystem, setFilterSystem] = useState('all');
  const [filterService, setFilterService] = useState('all');

  const dateRange = dateFrom || dateTo ? { from: dateFrom, to: dateTo } : undefined;

  const { data: report, isLoading } = useQuery({
    queryKey: ['reports', dateFrom, dateTo],
    queryFn: () => fetchReportData(dateRange),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments-filter'],
    queryFn: async () => { const { data } = await supabase.from('departments').select('id, name'); return data || []; },
  });
  const { data: systems = [] } = useQuery({
    queryKey: ['systems-filter'],
    queryFn: async () => { const { data } = await supabase.from('systems').select('id, name, code').eq('is_active', true); return data || []; },
  });
  const { data: services = [] } = useQuery({
    queryKey: ['services-filter'],
    queryFn: async () => { const { data } = await supabase.from('services').select('id, name, system_id').eq('is_active', true); return data || []; },
  });

  // Filter raw tickets
  const filteredReport = useMemo(() => {
    if (!report) return null;
    if (filterDept === 'all' && filterSystem === 'all' && filterService === 'all') return report;

    const filtered = (report.rawTickets || []).filter((t: any) => {
      if (filterDept !== 'all' && t.department !== departments.find((d: any) => d.id === filterDept)?.name) return false;
      if (filterSystem !== 'all' && t.system !== systems.find((s: any) => s.id === filterSystem)?.name) return false;
      if (filterService !== 'all' && t.service !== services.find((s: any) => s.id === filterService)?.name) return false;
      return true;
    });

    // Recalculate stats from filtered tickets
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};
    const bySystem: Record<string, number> = {};
    const byService: Record<string, number> = {};
    let slaMet = 0, slaBreaches = 0, totalResMs = 0, resolvedCount = 0;
    let totalFrMs = 0, frCount = 0, overdueCount = 0;

    filtered.forEach((t: any) => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      if (t.department) byDepartment[t.department] = (byDepartment[t.department] || 0) + 1;
      if (t.system) bySystem[t.system] = (bySystem[t.system] || 0) + 1;
      if (t.service) byService[t.service] = (byService[t.service] || 0) + 1;
      if (t.resolutionHours != null) { totalResMs += t.resolutionHours; resolvedCount++; }
      if (t.firstResponseHours != null) { totalFrMs += t.firstResponseHours; frCount++; }
      if (t.sla_met === true) slaMet++;
      if (t.sla_met === false) slaBreaches++;
      if (t.overdue) overdueCount++;
    });

    return {
      ...report,
      rawTickets: filtered,
      total: filtered.length,
      byStatus, byPriority, byDepartment, bySystem, byService,
      slaMet, slaBreaches,
      avgResolutionHours: resolvedCount > 0 ? Math.round(totalResMs / resolvedCount * 10) / 10 : 0,
      avgFirstResponseHours: frCount > 0 ? Math.round(totalFrMs / frCount * 10) / 10 : 0,
      slaCompliancePercent: (slaMet + slaBreaches) > 0 ? Math.round((slaMet / (slaMet + slaBreaches)) * 100) : 100,
      overdueCount,
    };
  }, [report, filterDept, filterSystem, filterService, departments, systems, services]);

  const applyPreset = (preset: typeof datePresets[0]) => {
    const val = preset.getValue();
    setDateFrom(val.from);
    setDateTo(val.to);
    setActivePreset(preset.label);
  };

  if (isLoading || !filteredReport) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const r = filteredReport;

  const statusData = Object.entries(r.byStatus).map(([key, val]) => ({
    name: statusLabels[key as keyof typeof statusLabels] || key,
    value: val as number,
  }));

  const priorityData = Object.entries(r.byPriority).map(([key, val]) => ({
    name: priorityLabels[key as keyof typeof priorityLabels] || key,
    value: val as number,
  }));

  const deptData = Object.entries(r.byDepartment).map(([key, val]) => ({
    name: key,
    value: val as number,
  }));

  const systemData = Object.entries(r.bySystem || {}).map(([key, val]) => ({
    name: key,
    value: val as number,
  }));

  const serviceData = Object.entries(r.byService || {}).map(([key, val]) => ({
    name: key,
    value: val as number,
  }));

  const slaByServiceData = Object.entries(r.slaByService || {}).map(([key, val]: any) => ({
    name: key,
    compliance: val.compliance,
    breaches: val.breaches,
  }));

  // Trend data - group by day
  const trendMap: Record<string, { date: string; count: number; resolved: number }> = {};
  (r.rawTickets || []).forEach((t: any) => {
    const day = t.created_at?.slice(0, 10);
    if (!day) return;
    if (!trendMap[day]) trendMap[day] = { date: day, count: 0, resolved: 0 };
    trendMap[day].count++;
    if (t.resolved_at) trendMap[day].resolved++;
  });
  const trendData = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

  const handleExportAll = () => {
    const rows = (r.rawTickets || []).map((t: any) => ({
      'رقم التذكرة': t.ticket_number,
      'العنوان': t.title,
      'الحالة': statusLabels[t.status as keyof typeof statusLabels] || t.status,
      'الأولوية': priorityLabels[t.priority as keyof typeof priorityLabels] || t.priority,
      'القسم': t.department || '',
      'النظام': t.system || '',
      'الخدمة': t.service || '',
      'تاريخ الإنشاء': t.created_at,
      'تاريخ الحل': t.resolved_at || '',
      'زمن الحل (ساعات)': t.resolutionHours ?? '',
      'زمن أول رد (ساعات)': t.firstResponseHours ?? '',
    }));
    downloadCSV(rows, `tickets-report-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handlePrint = () => window.print();

  const kpis = [
    { icon: BarChart3, value: r.total, label: 'إجمالي التذاكر', color: 'text-primary', trend: null },
    { icon: Clock, value: `${r.avgResolutionHours}h`, label: 'متوسط زمن الحل', color: 'text-accent', trend: null },
    { icon: Timer, value: `${r.avgFirstResponseHours ?? 0}h`, label: 'متوسط أول رد', color: 'text-info', trend: null },
    { icon: ShieldCheck, value: `${r.slaCompliancePercent}%`, label: 'الالتزام بالـ SLA', color: 'text-success', trend: r.slaCompliancePercent >= 80 ? 'up' : 'down' },
    { icon: AlertTriangle, value: r.slaBreaches, label: 'تجاوزات SLA', color: 'text-destructive', trend: r.slaBreaches === 0 ? 'up' : 'down' },
    { icon: AlertTriangle, value: r.overdueCount ?? 0, label: 'متأخرة حالياً', color: 'text-warning', trend: (r.overdueCount ?? 0) === 0 ? 'up' : 'down' },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 gap-3 shrink-0 no-print sticky top-0 z-30"
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-bold">التقارير والتحليلات</h1>
            </div>
            <div className="flex gap-2 items-center">
              <NotificationsPopover />
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportReportPDF(r, activePreset || `${dateFrom} - ${dateTo}`)}>
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">تصدير PDF</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">طباعة</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportAll}>
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">تصدير CSV</span>
              </Button>
            </div>
          </motion.header>

          <main className="flex-1 p-4 md:p-6 overflow-auto" id="report-content">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Date Filters */}
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Filter className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">فلتر الفترة الزمنية</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {datePresets.map(p => (
                        <Button
                          key={p.label}
                          variant={activePreset === p.label ? 'default' : 'outline'}
                          size="sm"
                          className="text-xs rounded-full"
                          onClick={() => applyPreset(p)}
                        >
                          {p.label}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          type="date"
                          value={dateFrom}
                          onChange={e => { setDateFrom(e.target.value); setActivePreset(''); }}
                          className="h-8 text-xs w-36"
                          dir="ltr"
                        />
                      </div>
                      <span className="text-muted-foreground text-xs">إلى</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={dateTo}
                          onChange={e => { setDateTo(e.target.value); setActivePreset(''); }}
                          className="h-8 text-xs w-36"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    {/* Additional Filters */}
                    <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <Select value={filterDept} onValueChange={setFilterDept}>
                          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="القسم" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">كل الأقسام</SelectItem>
                            {departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                        <Select value={filterSystem} onValueChange={setFilterSystem}>
                          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="النظام" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">كل الأنظمة</SelectItem>
                            {systems.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                        <Select value={filterService} onValueChange={setFilterService}>
                          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="الخدمة" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">كل الخدمات</SelectItem>
                            {services.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {kpis.map((kpi, i) => (
                  <motion.div key={i} custom={i + 1} variants={fadeUp} initial="hidden" animate="show">
                    <Card className="hover:shadow-card-hover transition-shadow duration-300 group">
                      <CardContent className="pt-4 text-center relative overflow-hidden">
                        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors" />
                        <kpi.icon className={`h-5 w-5 mx-auto mb-1.5 ${kpi.color}`} />
                        <div className="flex items-center justify-center gap-1">
                          <p className="text-2xl font-bold">{kpi.value}</p>
                          {kpi.trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-success" />}
                          {kpi.trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Trend Line Chart */}
              {trendData.length > 1 && (
                <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">اتجاه التذاكر بمرور الوقت</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="count" name="تم إنشاؤها" stroke="hsl(217, 72%, 50%)" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="resolved" name="تم حلها" stroke="hsl(199, 89%, 48%)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Row 1: Status + Priority */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div custom={8} variants={fadeUp} initial="hidden" animate="show">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">التذاكر حسب الحالة</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={statusData}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(217, 72%, 50%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div custom={9} variants={fadeUp} initial="hidden" animate="show">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">التذاكر حسب الأولوية</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                            {priorityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Row 2: System + Service */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {systemData.length > 0 && (
                  <motion.div custom={10} variants={fadeUp} initial="hidden" animate="show">
                    <Card>
                      <CardHeader><CardTitle className="text-sm">التذاكر حسب النظام</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={systemData}>
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="hsl(222, 60%, 42%)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {serviceData.length > 0 && (
                  <motion.div custom={11} variants={fadeUp} initial="hidden" animate="show">
                    <Card>
                      <CardHeader><CardTitle className="text-sm">التذاكر حسب الخدمة</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={serviceData} layout="vertical">
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                            <Tooltip />
                            <Bar dataKey="value" fill="hsl(217, 72%, 50%)" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>

              {/* Row 3: Department + SLA */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div custom={12} variants={fadeUp} initial="hidden" animate="show">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">التذاكر حسب القسم</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={deptData}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>

                {slaByServiceData.length > 0 && (
                  <motion.div custom={13} variants={fadeUp} initial="hidden" animate="show">
                    <Card>
                      <CardHeader><CardTitle className="text-sm">التزام SLA حسب الخدمة (%)</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={slaByServiceData}>
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                            <Tooltip />
                            <Bar dataKey="compliance" name="نسبة الالتزام %" fill="hsl(217, 72%, 50%)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>

              {/* Performance Dashboards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Operations Overview */}
                <motion.div custom={14} variants={fadeUp} initial="hidden" animate="show">
                  <Card className="border-t-4 border-t-primary">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold">نظرة عامة على العمليات</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                        <span className="text-xs text-muted-foreground">غير محلولة</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{r.total - (r.byStatus['resolved'] || 0) - (r.byStatus['closed'] || 0)}</span>
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${r.total ? ((r.total - (r.byStatus['resolved'] || 0) - (r.byStatus['closed'] || 0)) / r.total * 100) : 0}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                        <span className="text-xs text-muted-foreground">معلّقة</span>
                        <span className="text-sm font-bold">{(r.byStatus['new'] || 0) + (r.byStatus['waiting_on_customer'] || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                        <span className="text-xs text-muted-foreground">متأخرة</span>
                        <span className="text-sm font-bold text-destructive">{r.overdueCount ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-xs text-muted-foreground">تجاوزات SLA</span>
                        <span className="text-sm font-bold text-destructive">{r.slaBreaches}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Agent Performance */}
                <motion.div custom={15} variants={fadeUp} initial="hidden" animate="show">
                  <Card className="border-t-4 border-t-info">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold">أداء الفريق</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                        <span className="text-xs text-muted-foreground">متوسط زمن الحل</span>
                        <span className="text-sm font-bold">{r.avgResolutionHours}h</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                        <span className="text-xs text-muted-foreground">متوسط أول رد</span>
                        <span className="text-sm font-bold">{r.avgFirstResponseHours ?? 0}h</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                        <span className="text-xs text-muted-foreground">تم حلها</span>
                        <span className="text-sm font-bold text-success">{r.byStatus['resolved'] || 0}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-xs text-muted-foreground">مغلقة</span>
                        <span className="text-sm font-bold">{r.byStatus['closed'] || 0}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Customer Experience */}
                <motion.div custom={16} variants={fadeUp} initial="hidden" animate="show">
                  <Card className="border-t-4 border-t-success">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold">تجربة العميل</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-4">
                        <p className="text-xs text-muted-foreground mb-1">التزام SLA الإجمالي</p>
                        <div className="relative w-24 h-24 mx-auto">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--success))" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(r.slaCompliancePercent / 100) * 264} 264`} />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{r.slaCompliancePercent}%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">ضمن SLA</span>
                          <span className="font-bold text-success">{r.slaMet}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">تجاوزت SLA</span>
                          <span className="font-bold text-destructive">{r.slaBreaches}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Printable Table */}
              <motion.div custom={17} variants={fadeUp} initial="hidden" animate="show">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">جدول التذاكر التفصيلي</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-right p-2 font-medium">الرقم</th>
                          <th className="text-right p-2 font-medium">العنوان</th>
                          <th className="text-right p-2 font-medium">الحالة</th>
                          <th className="text-right p-2 font-medium">الأولوية</th>
                          <th className="text-right p-2 font-medium">النظام</th>
                          <th className="text-right p-2 font-medium">الخدمة</th>
                          <th className="text-right p-2 font-medium">زمن الحل</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(r.rawTickets || []).slice(0, 50).map((t: any, i: number) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="p-2">{t.ticket_number}</td>
                            <td className="p-2 max-w-[200px] truncate">{t.title}</td>
                            <td className="p-2">{statusLabels[t.status as keyof typeof statusLabels] || t.status}</td>
                            <td className="p-2">{priorityLabels[t.priority as keyof typeof priorityLabels] || t.priority}</td>
                            <td className="p-2">{t.system || '-'}</td>
                            <td className="p-2">{t.service || '-'}</td>
                            <td className="p-2">{t.resolutionHours ? `${t.resolutionHours}h` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
