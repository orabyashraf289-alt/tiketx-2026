import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Award, Star, Clock, CheckCircle, TrendingUp, Loader2, CalendarIcon, Download, ArrowUpDown, BarChart3, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, PieChart, Pie, Cell
} from 'recharts';

interface AgentStats {
  agent_id: string;
  name: string;
  resolved: number;
  avgResolutionHours: number;
  avgRating: number;
  ratingCount: number;
  assigned: number;
  inProgress: number;
  waitingOnCustomer: number;
  closed: number;
  firstResponseAvgHours: number;
}

async function fetchAgentPerformance(): Promise<{ agents: AgentStats[]; tickets: any[] }> {
  const { data: roles } = await supabase.from('user_roles').select('user_id, role').in('role', ['agent', 'admin']);
  if (!roles?.length) return { agents: [], tickets: [] };

  const agentIds = roles.map(r => r.user_id);

  const [profilesRes, ticketsRes, ratingsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name').in('id', agentIds),
    supabase.from('tickets').select('assigned_agent_id, status, created_at, resolved_at, first_response_at, priority').in('assigned_agent_id', agentIds),
    supabase.from('ticket_ratings').select('ticket_id, rating').then(async (res) => {
      if (!res.data?.length) return [];
      const ticketIds = res.data.map(r => r.ticket_id);
      const { data: tickets } = await supabase.from('tickets').select('id, assigned_agent_id').in('id', ticketIds);
      return res.data.map(r => ({
        ...r,
        agent_id: tickets?.find(t => t.id === r.ticket_id)?.assigned_agent_id,
      }));
    }),
  ]);

  const profiles = profilesRes.data || [];
  const tickets = ticketsRes.data || [];
  const ratings = ratingsRes || [];

  const agents = agentIds.map(id => {
    const name = profiles.find(p => p.id === id)?.full_name || 'غير معروف';
    const agentTickets = tickets.filter(t => t.assigned_agent_id === id);
    const resolved = agentTickets.filter(t => t.status === 'resolved' || t.status === 'closed');
    const inProgress = agentTickets.filter(t => t.status === 'in_progress').length;
    const waitingOnCustomer = agentTickets.filter(t => t.status === 'waiting_on_customer').length;
    const closed = agentTickets.filter(t => t.status === 'closed').length;

    let totalMs = 0;
    resolved.forEach(t => {
      if (t.resolved_at) totalMs += new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime();
    });

    let totalFrMs = 0;
    let frCount = 0;
    agentTickets.forEach(t => {
      if (t.first_response_at) {
        totalFrMs += new Date(t.first_response_at).getTime() - new Date(t.created_at).getTime();
        frCount++;
      }
    });

    const agentRatings = ratings.filter((r: any) => r.agent_id === id);
    const avgRating = agentRatings.length > 0
      ? agentRatings.reduce((s: number, r: any) => s + r.rating, 0) / agentRatings.length
      : 0;

    return {
      agent_id: id,
      name,
      resolved: resolved.length,
      avgResolutionHours: resolved.length > 0 ? Math.round(totalMs / resolved.length / (1000 * 60 * 60) * 10) / 10 : 0,
      avgRating: Math.round(avgRating * 10) / 10,
      ratingCount: agentRatings.length,
      assigned: agentTickets.length,
      inProgress,
      waitingOnCustomer,
      closed,
      firstResponseAvgHours: frCount > 0 ? Math.round(totalFrMs / frCount / (1000 * 60 * 60) * 10) / 10 : 0,
    };
  }).sort((a, b) => b.resolved - a.resolved);

  return { agents, tickets };
}

const medals = ['🥇', '🥈', '🥉'];

const CHART_COLORS = [
  'hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)', 'hsl(262, 83%, 58%)', 'hsl(190, 90%, 50%)',
  'hsl(340, 82%, 52%)', 'hsl(45, 93%, 47%)', 'hsl(160, 60%, 45%)', 'hsl(280, 65%, 60%)',
];

export default function AgentPerformance() {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [sortField, setSortField] = useState<keyof AgentStats>('resolved');
  const [sortAsc, setSortAsc] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['agent-performance'],
    queryFn: fetchAgentPerformance,
  });

  const agents = data?.agents || [];

  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => {
      const av = a[sortField], bv = b[sortField];
      if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av;
      return 0;
    });
  }, [agents, sortField, sortAsc]);

  const toggleSort = (field: keyof AgentStats) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  // Comparison Bar Chart data
  const comparisonData = useMemo(() => {
    return agents.map(a => ({
      name: a.name.split(' ')[0],
      محلولة: a.resolved,
      'متوسط الحل (ساعة)': a.avgResolutionHours,
      التقييم: a.avgRating,
    }));
  }, [agents]);

  // Radar chart data for top agents
  const radarData = useMemo(() => {
    if (agents.length === 0) return [];
    const maxResolved = Math.max(...agents.map(a => a.resolved), 1);
    const maxAssigned = Math.max(...agents.map(a => a.assigned), 1);
    const maxRating = 5;
    const maxSpeed = Math.max(...agents.map(a => a.avgResolutionHours), 1);

    return [
      { metric: 'التذاكر المحلولة', ...Object.fromEntries(agents.slice(0, 5).map(a => [a.name.split(' ')[0], Math.round(a.resolved / maxResolved * 100)])) },
      { metric: 'التذاكر المعينة', ...Object.fromEntries(agents.slice(0, 5).map(a => [a.name.split(' ')[0], Math.round(a.assigned / maxAssigned * 100)])) },
      { metric: 'التقييم', ...Object.fromEntries(agents.slice(0, 5).map(a => [a.name.split(' ')[0], Math.round(a.avgRating / maxRating * 100)])) },
      { metric: 'سرعة الحل', ...Object.fromEntries(agents.slice(0, 5).map(a => [a.name.split(' ')[0], maxSpeed > 0 ? Math.round((1 - a.avgResolutionHours / maxSpeed) * 100) : 50])) },
      { metric: 'سرعة الرد', ...Object.fromEntries(agents.slice(0, 5).map(a => [a.name.split(' ')[0], a.firstResponseAvgHours > 0 ? Math.round((1 - a.firstResponseAvgHours / Math.max(...agents.map(x => x.firstResponseAvgHours), 1)) * 100) : 50])) },
    ];
  }, [agents]);

  // Workload pie
  const workloadData = useMemo(() => {
    return agents.map((a, i) => ({
      name: a.name.split(' ')[0],
      value: a.assigned,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [agents]);

  const handleExportPDF = () => {
    const printContent = document.getElementById('agent-performance-content');
    if (!printContent) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html dir="rtl"><head><title>تقرير أداء الوكلاء</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 30px; direction: rtl; }
        h1 { color: #1a4b8c; border-bottom: 2px solid #1a4b8c; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
        th { background: #f0f4f8; color: #1a4b8c; }
        tr:nth-child(even) { background: #f9fafb; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .summary-card { background: #f0f4f8; border-radius: 8px; padding: 15px; text-align: center; flex: 1; }
        .summary-card .value { font-size: 24px; font-weight: bold; color: #1a4b8c; }
        .medal { font-size: 18px; }
        .footer { margin-top: 30px; text-align: center; color: #888; font-size: 12px; }
      </style></head><body>
      <h1>📊 تقرير أداء الوكلاء</h1>
      <p>الفترة: ${dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'الكل'} - ${dateTo ? format(dateTo, 'dd/MM/yyyy') : 'الكل'}</p>
      <div class="summary">
        <div class="summary-card"><div class="value">${agents.length}</div><div>عدد الوكلاء</div></div>
        <div class="summary-card"><div class="value">${agents.reduce((s, a) => s + a.resolved, 0)}</div><div>إجمالي المحلولة</div></div>
        <div class="summary-card"><div class="value">${agents.length > 0 ? Math.max(...agents.map(a => a.avgRating)) : 0}</div><div>أعلى تقييم</div></div>
      </div>
      <table>
        <thead><tr>
          <th>#</th><th>الوكيل</th><th>المعيّنة</th><th>المحلولة</th>
          <th>متوسط الحل (ساعة)</th><th>متوسط الرد (ساعة)</th><th>التقييم</th><th>عدد التقييمات</th>
        </tr></thead>
        <tbody>
          ${sortedAgents.map((a, i) => `<tr>
            <td><span class="medal">${i < 3 ? medals[i] : i + 1}</span></td>
            <td>${a.name}</td><td>${a.assigned}</td><td>${a.resolved}</td>
            <td>${a.avgResolutionHours}</td><td>${a.firstResponseAvgHours}</td>
            <td>${a.avgRating}</td><td>${a.ratingCount}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="footer">تم التصدير بتاريخ ${format(new Date(), 'dd MMMM yyyy - HH:mm', { locale: ar })}</div>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  };

  const presets = [
    { label: '7 أيام', days: 7 },
    { label: '30 يوم', days: 30 },
    { label: '90 يوم', days: 90 },
  ];

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
              <Award className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">أداء الوكلاء</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportPDF}>
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">تصدير PDF</span>
              </Button>
              <NotificationsPopover />
            </div>
          </motion.header>

          <main className="flex-1 overflow-auto p-4 md:p-6" id="agent-performance-content">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Date Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                {presets.map(p => (
                  <Button
                    key={p.days}
                    variant="outline"
                    size="sm"
                    className={cn("text-xs", dateFrom && Math.abs(subDays(new Date(), p.days).getTime() - dateFrom.getTime()) < 86400000 && "bg-primary text-primary-foreground")}
                    onClick={() => { setDateFrom(subDays(new Date(), p.days)); setDateTo(new Date()); }}
                  >
                    {p.label}
                  </Button>
                ))}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'من'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground text-xs">إلى</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'إلى'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Summary Cards */}
              {!isLoading && agents.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <SummaryCard icon={Users} label="عدد الوكلاء" value={agents.length} color="text-primary" />
                  <SummaryCard icon={CheckCircle} label="إجمالي المحلولة" value={agents.reduce((s, a) => s + a.resolved, 0)} color="text-emerald-600 dark:text-emerald-400" />
                  <SummaryCard icon={Clock} label="أسرع حل" value={`${Math.min(...agents.filter(a => a.avgResolutionHours > 0).map(a => a.avgResolutionHours)) || 0}h`} color="text-blue-600 dark:text-blue-400" />
                  <SummaryCard icon={Star} label="أعلى تقييم" value={Math.max(...agents.map(a => a.avgRating)) || 0} color="text-amber-600 dark:text-amber-400" />
                  <SummaryCard icon={TrendingUp} label="إجمالي المعيّنة" value={agents.reduce((s, a) => s + a.assigned, 0)} color="text-indigo-600 dark:text-indigo-400" />
                </div>
              )}

              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : agents.length === 0 ? (
                <Card><CardContent className="py-20 text-center text-muted-foreground">لا يوجد بيانات لأداء الوكلاء</CardContent></Card>
              ) : (
                <>
                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Comparison Bar Chart */}
                    <Card className="border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          مقارنة الأداء
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={comparisonData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <ReTooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(var(--border))' }} />
                            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="محلولة" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="متوسط الحل (ساعة)" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="التقييم" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Workload Distribution */}
                    <Card className="border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          توزيع الأعباء
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie data={workloadData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                              {workloadData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                            </Pie>
                            <ReTooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(var(--border))' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Radar Chart */}
                  {agents.length >= 2 && (
                    <Card className="border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary" />
                          مقارنة شاملة (أفضل 5 وكلاء)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={320}>
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid className="stroke-border" />
                            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                            <PolarRadiusAxis tick={false} domain={[0, 100]} />
                            {agents.slice(0, 5).map((a, i) => (
                              <Radar key={a.agent_id} name={a.name.split(' ')[0]} dataKey={a.name.split(' ')[0]}
                                stroke={CHART_COLORS[i]} fill={CHART_COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
                            ))}
                            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            <ReTooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(var(--border))' }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Detailed Comparison Table */}
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-primary" />
                        جدول المقارنة التفصيلي
                        <span className="text-[10px] text-muted-foreground font-normal">(اضغط على العنوان للترتيب)</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10 text-center">#</TableHead>
                              <TableHead>الوكيل</TableHead>
                              <SortableHead label="المعيّنة" field="assigned" current={sortField} asc={sortAsc} onSort={toggleSort} />
                              <SortableHead label="المحلولة" field="resolved" current={sortField} asc={sortAsc} onSort={toggleSort} />
                              <SortableHead label="متوسط الحل (ساعة)" field="avgResolutionHours" current={sortField} asc={sortAsc} onSort={toggleSort} />
                              <SortableHead label="متوسط الرد (ساعة)" field="firstResponseAvgHours" current={sortField} asc={sortAsc} onSort={toggleSort} />
                              <SortableHead label="التقييم" field="avgRating" current={sortField} asc={sortAsc} onSort={toggleSort} />
                              <TableHead className="text-center">الحالة</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedAgents.map((agent, i) => (
                              <TableRow key={agent.agent_id} className={i < 3 ? 'bg-primary/5' : ''}>
                                <TableCell className="text-center text-lg">
                                  {i < 3 ? medals[i] : <span className="text-sm text-muted-foreground">{i + 1}</span>}
                                </TableCell>
                                <TableCell className="font-semibold">{agent.name}</TableCell>
                                <TableCell className="text-center">{agent.assigned}</TableCell>
                                <TableCell className="text-center font-medium text-emerald-600 dark:text-emerald-400">{agent.resolved}</TableCell>
                                <TableCell className="text-center">{agent.avgResolutionHours}</TableCell>
                                <TableCell className="text-center">{agent.firstResponseAvgHours}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {agent.avgRating > 0 && (
                                      <>
                                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                        <span className="font-medium">{agent.avgRating}</span>
                                        <span className="text-[10px] text-muted-foreground">({agent.ratingCount})</span>
                                      </>
                                    )}
                                    {agent.avgRating === 0 && <span className="text-muted-foreground text-xs">—</span>}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-center gap-1 flex-wrap">
                                    {agent.inProgress > 0 && <Badge variant="outline" className="text-[9px] px-1 py-0 bg-indigo-500/10 text-indigo-600 border-0">{agent.inProgress} قيد المعالجة</Badge>}
                                    {agent.waitingOnCustomer > 0 && <Badge variant="outline" className="text-[9px] px-1 py-0 bg-orange-500/10 text-orange-600 border-0">{agent.waitingOnCustomer} انتظار</Badge>}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Leaderboard */}
                  <Card className="rounded-2xl border-border/50">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        ترتيب الوكلاء
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {agents.map((agent, i) => (
                          <motion.div
                            key={agent.agent_id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${
                              i < 3 ? 'bg-primary/5 border-primary/20' : 'border-border/50'
                            }`}
                          >
                            <span className="text-2xl w-8 text-center shrink-0">
                              {i < 3 ? medals[i] : <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-foreground truncate">{agent.name}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" />{agent.resolved} محلولة</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-blue-500" />{agent.avgResolutionHours}h حل</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-indigo-500" />{agent.firstResponseAvgHours}h رد</span>
                                {agent.ratingCount > 0 && (
                                  <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400 fill-amber-400" />{agent.avgRating} ({agent.ratingCount})</span>
                                )}
                              </div>
                            </div>
                            <div className="text-left shrink-0">
                              <p className="text-2xl font-bold text-foreground">{agent.assigned}</p>
                              <p className="text-[10px] text-muted-foreground">تذكرة</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <Card className="text-center border-border/50">
        <CardContent className="pt-5">
          <Icon className={cn("h-5 w-5 mx-auto mb-1.5", color)} />
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SortableHead({ label, field, current, asc, onSort }: {
  label: string; field: keyof AgentStats; current: keyof AgentStats; asc: boolean;
  onSort: (f: keyof AgentStats) => void;
}) {
  return (
    <TableHead className="text-center cursor-pointer hover:text-foreground transition-colors" onClick={() => onSort(field)}>
      <div className="flex items-center justify-center gap-1">
        {label}
        <ArrowUpDown className={cn("h-3 w-3", current === field ? "text-primary" : "text-muted-foreground/30")} />
      </div>
    </TableHead>
  );
}
