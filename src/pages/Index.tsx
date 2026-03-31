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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const listItem = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Dashboard() {
  const { role } = useAuth();
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

  const headerActions = (
    <>
      <div className="relative hidden md:block">
        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder={t.common.search} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="ltr:pl-9 rtl:pr-9 h-9 w-52 text-xs rounded-xl bg-muted/60 border-0 focus:bg-background focus:ring-1 focus:ring-primary/30" />
      </div>
      <Button className="gradient-primary text-white gap-2 text-sm rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all" onClick={() => navigate('/tickets/new')}>
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

      <main className="flex-1 overflow-auto" role="main">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-6 space-y-5">
          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard title={t.dashboard.unresolvedTickets} value={unresolvedCount} icon={Inbox} variant="primary" />
            <KPICard title={t.dashboard.pending} value={pendingCount} icon={Clock} variant="warning" />
            <KPICard title={t.dashboard.overdue} value={report?.overdueCount ?? 0} icon={AlertTriangle} variant="destructive" />
            <KPICard title={t.dashboard.slaBreaches} value={report?.slaBreaches ?? 0} icon={Shield} variant="destructive" trend={report?.slaBreaches === 0 ? 'up' : 'down'} />
            <KPICard title={t.dashboard.avgFirstResponse} value={`${report?.avgFirstResponseHours ?? 0}h`} icon={Timer} variant="info" />
            <KPICard title={t.dashboard.slaCompliance} value={`${report?.slaCompliancePercent ?? 0}%`} icon={CheckCircle2} variant="success" trend={(report?.slaCompliancePercent ?? 0) >= 80 ? 'up' : 'down'} />
          </div>

          {isAdmin && <DashboardCharts report={report} trendData={trendData} />}

          {isAdmin && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: t.dashboard.quickActions.reports, icon: BarChart3, path: '/admin/reports' },
                { label: t.dashboard.quickActions.users, icon: Users, path: '/admin/users' },
                { label: t.dashboard.quickActions.ticketInbox, icon: Inbox, path: '/tickets' },
                { label: t.dashboard.quickActions.knowledgeBase, icon: BookOpen, path: '/knowledge-base' },
                { label: t.dashboard.quickActions.newTicket, icon: Plus, path: '/tickets/new' },
              ].map((action) => (
                <motion.button
                  key={action.path}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(action.path)}
                  className="group flex items-center gap-2.5 p-3.5 rounded-xl border border-border/40 bg-card hover:border-primary/30 hover:shadow-card-hover transition-all duration-200 text-sm font-medium text-foreground"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <action.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="flex-1 text-start">{action.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          )}

          {/* Ticket List */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-card">
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

/* ─── KPI Card ─── */
const variantConfig = {
  primary: { bg: 'bg-primary/8', iconBg: 'bg-primary/15', color: 'text-primary' },
  warning: { bg: 'bg-warning/8', iconBg: 'bg-warning/15', color: 'text-warning' },
  destructive: { bg: 'bg-destructive/8', iconBg: 'bg-destructive/15', color: 'text-destructive' },
  success: { bg: 'bg-success/8', iconBg: 'bg-success/15', color: 'text-success' },
  info: { bg: 'bg-info/8', iconBg: 'bg-info/15', color: 'text-info' },
};

function KPICard({ title, value, icon: Icon, variant, trend }: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  variant: keyof typeof variantConfig;
  trend?: 'up' | 'down';
}) {
  const v = variantConfig[variant];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative rounded-2xl border border-border/40 bg-card p-4 transition-all duration-300 hover:shadow-card-hover hover:border-primary/30 overflow-hidden cursor-default"
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground font-medium leading-tight">{title}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold text-foreground">{value}</span>
            {trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-success" />}
            {trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl ${v.iconBg} flex items-center justify-center ${v.color} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
    </motion.div>
  );
}
