import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { fetchTickets, fetchTicketStats, fetchDepartments, fetchReportData, TicketStatus } from '@/lib/api';
import { PageLayout, PageHeader } from '@/components/layout';
import { TicketListItem } from '@/components/TicketListItem';
import { Input } from '@/components/ui/input';
import {
  Inbox, Clock, CheckCircle2, AlertTriangle, Search, Plus,
  Users, BarChart3, Shield, Timer, TrendingUp,
  TrendingDown, BookOpen, ArrowUpRight,
} from 'lucide-react';
import { DashboardSkeleton } from '@/components/SkeletonLoaders';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardCharts } from '@/components/DashboardCharts';
import { useRealtimeTickets } from '@/hooks/useRealtimeTickets';
import { useLanguage } from '@/i18n';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const listItem = {
  hidden: { opacity: 0, x: 16, filter: 'blur(4px)' },
  visible: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function Dashboard() {
  const { role, profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState(7);

  useRealtimeTickets();

  const statusFilters: { label: string; value: TicketStatus | 'all' }[] = [
    { label: t.common.all, value: 'all' },
    { label: t.tickets.new, value: 'new' },
    { label: t.tickets.open, value: 'open' },
    { label: t.tickets.inProgress, value: 'in_progress' },
    { label: t.tickets.waitingOnCustomer, value: 'waiting_on_customer' },
    { label: t.tickets.resolved, value: 'resolved' },
    { label: t.tickets.closed, value: 'closed' },
  ];

  const datePresets = [
    { label: t.dashboard.last7Days, days: 7 },
    { label: t.dashboard.last30Days, days: 30 },
    { label: t.dashboard.last90Days, days: 90 },
  ];

  const rangeFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - dateRange);
    return d.toISOString().slice(0, 10);
  }, [dateRange]);
  const rangeTo = useMemo(() => new Date().toISOString().slice(0, 10), []);

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

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesSearch = !searchQuery || ticket.title.includes(searchQuery) || ticket.ticket_number.toString().includes(searchQuery);
    const matchesDept = deptFilter === 'all' || ticket.department_id === deptFilter;
    return matchesStatus && matchesSearch && matchesDept;
  });

  const unresolvedCount = (stats?.new ?? 0) + (stats?.open ?? 0) + (stats?.in_progress ?? 0) + (stats?.waiting_on_customer ?? 0) + (stats?.reopened ?? 0);
  const pendingCount = (stats?.new ?? 0) + (stats?.waiting_on_customer ?? 0);

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

  const isAdmin = role === 'admin' || role === 'agent' || role === 'developer';

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? '☀️ صباح الخير' : hour < 18 ? '🌤️ مساء الخير' : '🌙 مساء الخير';

  const headerActions = (
    <>
      <div className="relative hidden md:block">
        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder={t.common.search} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="ltr:pl-9 rtl:pr-9 h-9 w-52 text-xs rounded-xl bg-muted/60 border-0 focus:bg-background focus:ring-1 focus:ring-primary/30" />
      </div>
      <Button className="gradient-primary text-primary-foreground gap-2 text-sm rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all" onClick={() => navigate('/tickets/new')}>
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">{t.sidebar.newTicket}</span>
      </Button>
    </>
  );

  const dateBadge = (
    <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
      {datePresets.map(p => (
        <button
          key={p.days}
          onClick={() => setDateRange(p.days)}
          className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 ${
            dateRange === p.days ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  return (
    <PageLayout>
      <PageHeader
        title={t.dashboard.title}
        icon={<BarChart3 className="h-5 w-5" />}
        badge={dateBadge}
        actions={headerActions}
      />

      <main className="flex-1 overflow-auto bg-muted/30" role="main">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-6 space-y-5">

          {/* Welcome Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                {greeting}، {profile?.full_name || ''}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{t.dashboard.title}</p>
            </div>
          </motion.div>

          {/* Overview Section */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-card border border-border/50 p-5 shadow-card"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground">نظرة عامة على النظام</h3>
              <span className="text-[10px] text-success font-semibold flex items-center gap-1 mr-auto rtl:ml-auto rtl:mr-0">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> مباشر
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <OverviewStat label={t.dashboard.unresolvedTickets} value={unresolvedCount} color="destructive" icon={Inbox} />
              <OverviewStat label={t.dashboard.pending} value={pendingCount} color="warning" icon={Clock} />
              <OverviewStat label="تم الحل" value={stats?.resolved ?? 0} color="success" icon={CheckCircle2} />
              <OverviewStat label={t.dashboard.overdue} value={report?.overdueCount ?? 0} color="destructive" icon={AlertTriangle} />
              <OverviewStat label={t.dashboard.slaBreaches} value={report?.slaBreaches ?? 0} color="primary" icon={Shield} />
              <OverviewStat label="المغلقة" value={stats?.closed ?? 0} color="info" icon={Inbox} />
            </div>
          </motion.div>

          {/* KPI Cards */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <KPICard
              title={t.dashboard.slaCompliance}
              value={`${report?.slaCompliancePercent ?? 0}%`}
              icon={TrendingUp}
              color="primary"
              trend={report?.slaCompliancePercent ? `${report.slaCompliancePercent >= 80 ? '↑' : '↓'} ${report.slaCompliancePercent}%` : undefined}
              trendUp={(report?.slaCompliancePercent ?? 0) >= 80}
            />
            <KPICard
              title={t.dashboard.avgFirstResponse}
              value={`${report?.avgFirstResponseHours ?? 0} ساعة`}
              icon={Timer}
              color="warning"
            />
            <KPICard
              title="معدل الحل"
              value={tickets.length > 0 ? `${Math.round(((stats?.resolved ?? 0) / tickets.length) * 100)}%` : '0%'}
              icon={CheckCircle2}
              color="success"
            />
            <KPICard
              title="إجمالي التذاكر"
              value={tickets.length}
              icon={BarChart3}
              color="info"
            />
          </motion.div>

          {/* Quick Actions */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-foreground">⚡ إجراءات سريعة</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: t.dashboard.quickActions.reports, icon: BarChart3, path: '/admin/reports', color: 'primary' },
                  { label: t.dashboard.quickActions.users, icon: Users, path: '/admin/users', color: 'accent' },
                  { label: t.dashboard.quickActions.ticketInbox, icon: Inbox, path: '/tickets', color: 'success' },
                  { label: t.dashboard.quickActions.knowledgeBase, icon: BookOpen, path: '/knowledge-base', color: 'info' },
                  { label: t.dashboard.quickActions.newTicket, icon: Plus, path: '/tickets/new', color: 'warning' },
                ].map((action) => (
                  <motion.button
                    key={action.path}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(action.path)}
                    className={`group flex flex-col items-center gap-2 p-4 rounded-2xl border border-border/40 bg-${action.color}/5 hover:bg-${action.color}/10 hover:border-${action.color}/30 hover:shadow-card-hover transition-all duration-200`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-${action.color}/15 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <action.icon className={`h-5 w-5 text-${action.color}`} />
                    </div>
                    <span className="text-xs font-semibold text-foreground">{action.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {isAdmin && <DashboardCharts report={report} trendData={trendData} />}

          {/* Ticket List */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-card"
          >
            <div className="p-4 border-b border-border/40">
              <div className="flex items-center gap-3 mb-3 md:hidden">
                <div className="relative flex-1">
                  <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t.tickets.searchTickets} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="ltr:pl-9 rtl:pr-9 rounded-xl" />
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {statusFilters.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      statusFilter === f.value
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${deptFilter === 'all' ? 'bg-accent text-accent-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}`}
                  >{t.common.all}</button>
                  {departments.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDeptFilter(d.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${deptFilter === d.id ? 'bg-accent text-accent-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}`}
                    >{d.name}</button>
                  ))}
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {ticketsLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <DashboardSkeleton />
                </motion.div>
              ) : filteredTickets.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <Inbox className="h-8 w-8 opacity-30" />
                  </div>
                  <p className="font-medium">{t.dashboard.noTickets}</p>
                </motion.div>
              ) : (
                <motion.div key="list" variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-border/40">
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
    </PageLayout>
  );
}

/* ─── Overview Stat (Small colored card) ─── */
function OverviewStat({ label, value, color, icon: Icon }: {
  label: string;
  value: number | string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl bg-${color}/8 border border-${color}/15 cursor-default hover:shadow-card-hover`}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <Icon className={`h-5 w-5 text-${color}`} />
      </motion.div>
      <motion.span
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }}
        className={`text-2xl font-bold text-${color}`}
      >
        {value}
      </motion.span>
      <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight">{label}</span>
    </motion.div>
  );
}

/* ─── KPI Card (Large metric card) ─── */
function KPICard({ title, value, icon: Icon, color, trend, trendUp }: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
      className={`relative rounded-2xl bg-${color}/5 border border-${color}/15 p-5 overflow-hidden cursor-default hover:shadow-card-hover transition-shadow duration-500`}
    >
      {/* Background glow effect */}
      <div className={`absolute -top-12 ltr:-right-12 rtl:-left-12 w-32 h-32 rounded-full bg-${color}/5 blur-2xl pointer-events-none`} />
      
      <div className="flex items-start justify-between relative">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
            className="text-3xl font-bold text-foreground"
          >
            {value}
          </motion.p>
          {trend && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                trendUp ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
              }`}
            >
              {trend}
            </motion.span>
          )}
        </div>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }}
          className={`w-12 h-12 rounded-2xl bg-${color}/15 flex items-center justify-center`}
        >
          <Icon className={`h-6 w-6 text-${color}`} />
        </motion.div>
      </div>
    </motion.div>
  );
}
