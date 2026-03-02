import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { fetchTickets, fetchTicketStats, fetchDepartments, TicketStatus } from '@/lib/api';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { TicketListItem } from '@/components/TicketListItem';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Inbox, Clock, CheckCircle2, AlertTriangle, Search, Plus, Loader2, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { motion } from 'framer-motion';

const statusFilters: { label: string; value: TicketStatus | 'all' }[] = [
  { label: 'الكل', value: 'all' },
  { label: 'جديدة', value: 'new' },
  { label: 'مفتوحة', value: 'open' },
  { label: 'قيد المعالجة', value: 'in_progress' },
  { label: 'بانتظار العميل', value: 'waiting_on_customer' },
  { label: 'تم الحل', value: 'resolved' },
  { label: 'مغلقة', value: 'closed' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  delay?: number;
}

function StatCard({ title, value, icon: Icon, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card className="overflow-hidden hover:shadow-card-hover transition-shadow duration-300 group">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">{title}</p>
              <motion.p
                className="text-3xl font-bold mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: delay + 0.2 }}
              >
                {value}
              </motion.p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: fetchTickets,
  });

  const { data: stats } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: fetchTicketStats,
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

  // Quick stats
  const openCount = (stats?.new ?? 0) + (stats?.open ?? 0);
  const resolvedToday = tickets.filter(t => {
    if (t.status !== 'resolved' && t.status !== 'closed') return false;
    const resolved = t.resolved_at || t.closed_at;
    if (!resolved) return false;
    return new Date(resolved).toDateString() === new Date().toDateString();
  }).length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 gap-4 shrink-0 no-print">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-bold hidden sm:block">لوحة التحكم</h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationsPopover />
              <Button className="gradient-accent text-accent-foreground gap-2 text-sm" onClick={() => navigate('/tickets/new')}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">تذكرة جديدة</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {/* Welcome Banner */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 rounded-xl gradient-primary p-5 text-white"
            >
              <h2 className="text-xl font-bold mb-1">مرحباً بك في لوحة التحكم 👋</h2>
              <p className="text-sm opacity-90">إليك ملخص حالة التذاكر في النظام</p>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard title="إجمالي التذاكر" value={stats?.total ?? 0} icon={Inbox} color="gradient-primary" delay={0} />
              <StatCard title="جديدة / مفتوحة" value={openCount} icon={AlertTriangle} color="bg-warning" delay={0.1} />
              <StatCard title="قيد المعالجة" value={stats?.in_progress ?? 0} icon={Clock} color="bg-info" delay={0.2} />
              <StatCard title="تم الحل" value={stats?.resolved ?? 0} icon={CheckCircle2} color="bg-success" delay={0.3} />
            </div>

            {/* Quick Actions Row */}
            {(role === 'admin' || role === 'agent') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
              >
                {[
                  { label: 'تقارير', icon: BarChart3, path: '/admin/reports' },
                  { label: 'المستخدمين', icon: Users, path: '/admin/users' },
                  { label: 'صندوق التذاكر', icon: Inbox, path: '/tickets' },
                  { label: 'تذكرة جديدة', icon: Plus, path: '/tickets/new' },
                ].map((action, i) => (
                  <motion.button
                    key={action.path}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(action.path)}
                    className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:shadow-card-hover transition-shadow text-sm font-medium"
                  >
                    <action.icon className="h-4 w-4 text-primary" />
                    {action.label}
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Ticket List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-lg border bg-card"
            >
              <div className="p-4 border-b">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="بحث في التذاكر..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9" />
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {statusFilters.map(f => (
                    <motion.button
                      key={f.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStatusFilter(f.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        statusFilter === f.value
                          ? 'gradient-accent text-accent-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {f.label}
                    </motion.button>
                  ))}
                </div>
                {(role === 'agent' || role === 'admin') && departments.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    <button
                      onClick={() => setDeptFilter('all')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${deptFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    >الكل</button>
                    {departments.map(d => (
                      <button
                        key={d.id}
                        onClick={() => setDeptFilter(d.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${deptFilter === d.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                      >{d.name}</button>
                    ))}
                  </div>
                )}
              </div>

              {ticketsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Inbox className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">لا توجد تذاكر</p>
                </div>
              ) : (
                <motion.div variants={container} initial="hidden" animate="show" className="divide-y">
                  {filteredTickets.map((ticket, i) => (
                    <motion.div key={ticket.id} variants={item}>
                      <TicketListItem ticket={ticket} index={i} onClick={() => navigate(`/tickets/${ticket.id}`)} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
