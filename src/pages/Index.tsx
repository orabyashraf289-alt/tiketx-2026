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
  TrendingDown, BookOpen,
} from 'lucide-react';
import { DashboardSkeleton } from '@/components/SkeletonLoaders';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardCharts } from '@/components/DashboardCharts';
import { useRealtimeTickets } from '@/hooks/useRealtimeTickets';
import { useLanguage } from '@/i18n';

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
        <Input placeholder={t.common.search} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="ltr:pl-9 rtl:pr-9 h-8 w-48 text-xs rounded-full" />
      </div>
      <Button className="gradient-accent text-accent-foreground gap-2 text-sm shadow-lg shadow-primary/20" onClick={() => navigate('/tickets/new')}>
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">{t.sidebar.newTicket}</span>
      </Button>
    </>
  );

  const dateBadge = (
    <div className="flex gap-1">
      {datePresets.map(p => (
        <button
          key={p.days}
          onClick={() => setDateRange(p.days)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
            dateRange === p.days ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-6 space-y-6">
              {/* KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <KPICard title={t.dashboard.unresolvedTickets} value={unresolvedCount} icon={Inbox} color="text-primary" bgGradient="from-primary/10 to-primary/5" />
                <KPICard title={t.dashboard.pending} value={pendingCount} icon={Clock} color="text-warning" bgGradient="from-warning/10 to-warning/5" />
                <KPICard title={t.dashboard.overdue} value={report?.overdueCount ?? 0} icon={AlertTriangle} color="text-destructive" bgGradient="from-destructive/10 to-destructive/5" />
                <KPICard title={t.dashboard.slaBreaches} value={report?.slaBreaches ?? 0} icon={Shield} color="text-destructive" bgGradient="from-destructive/10 to-destructive/5" trend={report?.slaBreaches === 0 ? 'up' : 'down'} />
                <KPICard title={t.dashboard.avgFirstResponse} value={`${report?.avgFirstResponseHours ?? 0}h`} icon={Timer} color="text-info" bgGradient="from-info/10 to-info/5" />
                <KPICard title={t.dashboard.slaCompliance} value={`${report?.slaCompliancePercent ?? 0}%`} icon={CheckCircle2} color="text-success" bgGradient="from-success/10 to-success/5" trend={(report?.slaCompliancePercent ?? 0) >= 80 ? 'up' : 'down'} />
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
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-card">
                <div className="p-4 border-b border-border/50">
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
                      >{t.common.all}</button>
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
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <DashboardSkeleton />
                    </motion.div>
                  ) : filteredTickets.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <Inbox className="h-12 w-12 mb-3 opacity-30" />
                      <p className="font-medium">{t.dashboard.noTickets}</p>
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
      className={`rounded-2xl border border-border/50 bg-gradient-to-br ${bgGradient} p-4 transition-shadow hover:shadow-card-hover`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground font-medium">{title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xl font-bold text-foreground">{value}</span>
            {trend === 'up' && <TrendingUp className="h-3 w-3 text-success" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3 text-destructive" />}
          </div>
        </div>
        <div className={`w-9 h-9 rounded-xl bg-card/80 flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}
