import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { fetchTickets, fetchTicketStats, fetchDepartments, fetchReportData, TicketStatus, statusLabels } from '@/lib/api';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { TicketListItem } from '@/components/TicketListItem';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Inbox, Clock, CheckCircle2, AlertTriangle, Search, Plus, Loader2,
  Users, BarChart3, Shield, Zap, Globe, Headphones, Timer, TrendingUp,
  TrendingDown, Activity, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';

const statusFilters: { label: string; value: TicketStatus | 'all' }[] = [
  { label: 'الكل', value: 'all' },
  { label: 'جديدة', value: 'new' },
  { label: 'مفتوحة', value: 'open' },
  { label: 'قيد المعالجة', value: 'in_progress' },
  { label: 'بانتظار العميل', value: 'waiting_on_customer' },
  { label: 'تم الحل', value: 'resolved' },
  { label: 'مغلقة', value: 'closed' },
];

const COLORS = [
  'hsl(152, 55%, 38%)', 'hsl(160, 60%, 42%)', 'hsl(38, 92%, 50%)',
  'hsl(199, 89%, 48%)', 'hsl(0, 72%, 51%)', 'hsl(280, 60%, 50%)', 'hsl(45, 90%, 48%)'
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const listItem = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const datePresets = [
  { label: 'آخر 7 أيام', days: 7 },
  { label: 'آخر 30 يوم', days: 30 },
  { label: 'آخر 90 يوم', days: 90 },
];

export default function Dashboard() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState(7);

  const rangeFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - dateRange);
    return d.toISOString().slice(0, 10);
  }, [dateRange]);
  const rangeTo = new Date().toISOString().slice(0, 10);

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: fetchTickets,
  });

  const { data: stats } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: fetchTicketStats,
  });

  const { data: report } = useQuery({
    queryKey: ['reports', rangeFrom, rangeTo],
    queryFn: () => fetchReportData({ from: rangeFrom, to: rangeTo }),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesSearch = !searchQuery || t.title.includes(searchQuery) || t.ticket_number.toString().includes(searchQuery);
    const matchesDept = deptFilter === 'all' || t.department_id === deptFilter;
    return matchesStatus && matchesSearch && matchesDept;
  });

  // Derive dashboard KPIs
  const unresolvedCount = (stats?.new ?? 0) + (stats?.open ?? 0) + (stats?.in_progress ?? 0) + (stats?.waiting_on_customer ?? 0) + (stats?.reopened ?? 0);
  const pendingCount = (stats?.new ?? 0) + (stats?.waiting_on_customer ?? 0);

  // Trend data from report
  const trendData = useMemo(() => {
    if (!report?.rawTickets) return [];
    const map: Record<string, { date: string; created: number; resolved: number }> = {};
    report.rawTickets.forEach((t: any) => {
      const day = t.created_at?.slice(0, 10);
      if (!day) return;
      if (!map[day]) map[day] = { date: day, created: 0, resolved: 0 };
      map[day].created++;
      if (t.resolved_at) map[day].resolved++;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [report]);

  // Status data for pie
  const statusPieData = useMemo(() => {
    if (!report?.byStatus) return [];
    return Object.entries(report.byStatus).map(([k, v]) => ({
      name: statusLabels[k as TicketStatus] || k,
      value: v as number,
    })).filter(d => d.value > 0);
  }, [report]);

  // Source data
  const sourceData = useMemo(() => {
    if (!report?.bySystem) return [];
    return Object.entries(report.bySystem).map(([k, v]) => ({
      name: k,
      value: v as number,
    })).filter(d => d.value > 0);
  }, [report]);

  const isAdmin = role === 'admin' || role === 'agent';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 gap-4 shrink-0 no-print sticky top-0 z-30"
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-bold hidden sm:block text-foreground">لوحة التحكم</h1>
              {/* Date range filter */}
              <div className="flex gap-1 mr-2">
                {datePresets.map(p => (
                  <button
                    key={p.days}
                    onClick={() => setDateRange(p.days)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                      dateRange === p.days
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden md:block">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="بحث..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9 h-8 w-48 text-xs rounded-full" />
              </div>
              <NotificationsPopover />
              <Button className="gradient-accent text-accent-foreground gap-2 text-sm shadow-lg shadow-primary/20" onClick={() => navigate('/tickets/new')}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">تذكرة جديدة</span>
              </Button>
            </div>
          </motion.header>

          <main className="flex-1 overflow-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 md:p-6 space-y-6"
            >
              {/* Top KPI Row - matching wireframe */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KPICard title="تذاكر غير محلولة" value={unresolvedCount} icon={Inbox} color="text-primary" bgGradient="from-primary/10 to-primary/5" />
                <KPICard title="معلّقة" value={pendingCount} icon={Clock} color="text-warning" bgGradient="from-warning/10 to-warning/5" />
                <KPICard title="متأخرة" value={report?.overdueCount ?? 0} icon={AlertTriangle} color="text-destructive" bgGradient="from-destructive/10 to-destructive/5" />
                <KPICard title="تجاوزات SLA" value={report?.slaBreaches ?? 0} icon={Shield} color="text-destructive" bgGradient="from-destructive/10 to-destructive/5" trend={report?.slaBreaches === 0 ? 'up' : 'down'} />
              </div>

              {/* Row 2: Avg First Response + Weekly Trend */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Avg First Response */}
                <Card className="lg:col-span-1">
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Timer className="h-4 w-4 text-info" />
                      <span className="text-xs font-medium text-muted-foreground">متوسط أول رد</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-foreground">{report?.avgFirstResponseHours ?? 0}h</span>
                      {report?.avgFirstResponseHours !== undefined && (
                        <span className={`text-xs flex items-center gap-0.5 ${(report?.avgFirstResponseHours ?? 0) < 4 ? 'text-success' : 'text-warning'}`}>
                          {(report?.avgFirstResponseHours ?? 0) < 4 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                          {(report?.avgFirstResponseHours ?? 0) < 4 ? 'جيد' : 'يحتاج تحسين'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 mb-3">
                      <Activity className="h-3.5 w-3.5 text-accent" />
                      <span className="text-xs text-muted-foreground">متوسط الحل: {report?.avgResolutionHours ?? 0}h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">التزام SLA</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-success rounded-full transition-all" style={{ width: `${report?.slaCompliancePercent ?? 0}%` }} />
                      </div>
                      <span className="text-xs font-bold text-success">{report?.slaCompliancePercent ?? 0}%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Weekly Trend Area Chart */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      اتجاه التذاكر
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {trendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={trendData}>
                          <defs>
                            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(152, 55%, 38%)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(152, 55%, 38%)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="created" name="تم إنشاؤها" stroke="hsl(152, 55%, 38%)" fill="url(#colorCreated)" strokeWidth={2} />
                          <Area type="monotone" dataKey="resolved" name="تم حلها" stroke="hsl(199, 89%, 48%)" fill="url(#colorResolved)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">لا توجد بيانات في هذه الفترة</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Row 3: Status Pie + Source Bar */}
              {isAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">التذاكر حسب الحالة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {statusPieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                              {statusPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">لا توجد بيانات</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">التذاكر حسب المصدر</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {sourceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={sourceData}>
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="hsl(160, 60%, 42%)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">لا توجد بيانات</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Quick Actions */}
              {isAdmin && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'تقارير', icon: BarChart3, path: '/admin/reports' },
                    { label: 'المستخدمين', icon: Users, path: '/admin/users' },
                    { label: 'صندوق التذاكر', icon: Inbox, path: '/tickets' },
                    { label: 'قاعدة المعرفة', icon: BookOpen, path: '/knowledge-base' },
                    { label: 'تذكرة جديدة', icon: Plus, path: '/tickets/new' },
                  ].map((action) => (
                    <motion.button
                      key={action.path}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(action.path)}
                      className="flex items-center gap-2 p-3.5 rounded-xl border border-border/50 bg-card hover:shadow-card-hover transition-all text-sm font-medium text-foreground"
                    >
                      <action.icon className="h-4 w-4 text-primary" />
                      {action.label}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Ticket List */}
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-center gap-3 mb-3 md:hidden">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="بحث في التذاكر..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9 rounded-xl" />
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {statusFilters.map(f => (
                      <button
                        key={f.value}
                        onClick={() => setStatusFilter(f.value)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                          statusFilter === f.value
                            ? 'gradient-accent text-accent-foreground shadow-md shadow-primary/20'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  {isAdmin && departments.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      <button
                        onClick={() => setDeptFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${deptFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                      >الكل</button>
                      {departments.map(d => (
                        <button
                          key={d.id}
                          onClick={() => setDeptFilter(d.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${deptFilter === d.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                        >{d.name}</button>
                      ))}
                    </div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {ticketsLoading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </motion.div>
                  ) : filteredTickets.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <Inbox className="h-12 w-12 mb-3 opacity-30" />
                      <p className="font-medium">لا توجد تذاكر</p>
                    </motion.div>
                  ) : (
                    <motion.div key="list" variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-border/50">
                      {filteredTickets.map((ticket, i) => (
                        <motion.div key={ticket.id} variants={listItem}>
                          <TicketListItem ticket={ticket} index={i} onClick={() => navigate(`/tickets/${ticket.id}`)} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// KPI Card component
function KPICard({ title, value, icon: Icon, color, bgGradient, trend }: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  trend?: 'up' | 'down';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3 }}
      className={`rounded-2xl border border-border/50 bg-gradient-to-br ${bgGradient} p-5 transition-shadow hover:shadow-card-hover`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-2xl font-bold text-foreground">{value}</span>
            {trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-success" />}
            {trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-card/80 flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
