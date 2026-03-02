import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { fetchTickets, fetchTicketStats, fetchDepartments, TicketStatus } from '@/lib/api';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { TicketListItem } from '@/components/TicketListItem';
import { Input } from '@/components/ui/input';
import { Inbox, Clock, CheckCircle2, AlertTriangle, Search, Plus, Loader2, Users, BarChart3, Shield, Zap, Globe, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { motion, AnimatePresence } from 'framer-motion';

const statusFilters: { label: string; value: TicketStatus | 'all' }[] = [
  { label: 'الكل', value: 'all' },
  { label: 'جديدة', value: 'new' },
  { label: 'مفتوحة', value: 'open' },
  { label: 'قيد المعالجة', value: 'in_progress' },
  { label: 'بانتظار العميل', value: 'waiting_on_customer' },
  { label: 'تم الحل', value: 'resolved' },
  { label: 'مغلقة', value: 'closed' },
];

// Animation variants
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const fadeScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const listItem = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const floatingVariant = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
  },
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  delay?: number;
}

function StatCard({ title, value, icon: Icon, gradient, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      variants={fadeScale}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow duration-300 group cursor-default"
    >
      {/* Decorative bg circle */}
      <div className={`absolute -top-6 -left-6 w-24 h-24 rounded-full opacity-10 ${gradient} blur-xl group-hover:opacity-20 transition-opacity duration-500`} />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium tracking-wide">{title}</p>
          <motion.p
            className="text-3xl font-bold mt-1.5 text-foreground"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.3, type: 'spring', stiffness: 200 }}
          >
            {value}
          </motion.p>
        </div>
        <motion.div
          variants={floatingVariant}
          animate="animate"
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient} shadow-lg`}
        >
          <Icon className="h-6 w-6 text-white" />
        </motion.div>
      </div>
    </motion.div>
  );
}

const features = [
  { icon: Shield, title: 'إدارة آمنة', desc: 'حماية كاملة للبيانات مع صلاحيات متعددة المستويات' },
  { icon: Zap, title: 'سرعة فائقة', desc: 'معالجة فورية للطلبات مع إشعارات لحظية' },
  { icon: Globe, title: 'متاح دائماً', desc: 'وصول من أي مكان عبر المتصفح بدون تثبيت' },
  { icon: Headphones, title: 'دعم متكامل', desc: 'نظام تذاكر ذكي مع تتبع كامل لدورة الحياة' },
];

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

  const openCount = (stats?.new ?? 0) + (stats?.open ?? 0);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 gap-4 shrink-0 no-print sticky top-0 z-30"
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-bold hidden sm:block text-foreground">لوحة التحكم</h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationsPopover />
              <Button className="gradient-accent text-accent-foreground gap-2 text-sm shadow-lg shadow-primary/20" onClick={() => navigate('/tickets/new')}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">تذكرة جديدة</span>
              </Button>
            </div>
          </motion.header>

          <main className="flex-1 overflow-auto">
            <motion.div
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              className="p-4 md:p-6 space-y-8"
            >
              {/* Hero Welcome Section */}
              <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl gradient-primary p-8 md:p-10 text-white">
                {/* Animated background shapes */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                  className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-white/5 blur-sm"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                  className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white/5 blur-sm"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-10 right-20 w-4 h-4 rounded-full bg-white/20"
                />
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute bottom-10 left-32 w-3 h-3 rounded-full bg-white/15"
                />

                <div className="relative z-10">
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                  >
                    <h2 className="text-2xl md:text-3xl font-extrabold mb-2">
                      مرحباً بك في نظام إدارة الطلبات 👋
                    </h2>
                    <p className="text-sm md:text-base opacity-90 max-w-2xl leading-relaxed">
                      منصة متكاملة لإدارة التذاكر والطلبات بكفاءة عالية. تتبع جميع الطلبات، 
                      تواصل مع فريقك، واحصل على تقارير شاملة - كل ذلك من مكان واحد.
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="flex gap-3 mt-5"
                  >
                    <Button
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                      onClick={() => navigate('/tickets/new')}
                    >
                      <Plus className="h-4 w-4 ml-1" />
                      تقديم طلب
                    </Button>
                    <Button
                      variant="secondary"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                      onClick={() => navigate('/tickets')}
                    >
                      <Inbox className="h-4 w-4 ml-1" />
                      صندوق الطلبات
                    </Button>
                  </motion.div>
                </div>
              </motion.div>

              {/* About Section */}
              <motion.div variants={fadeUp}>
                <div className="text-center mb-6">
                  <motion.h3
                    className="text-xl font-bold text-foreground mb-2"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                  >
                    نبذة عن النظام
                  </motion.h3>
                  <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                    نظام متطور لإدارة طلبات الدعم الفني والخدمات، مصمم لتسريع الاستجابة وتحسين تجربة المستخدم
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {features.map((f, i) => (
                    <motion.div
                      key={f.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      whileHover={{ y: -4 }}
                      className="rounded-2xl border border-border/50 bg-card p-5 text-center group hover:shadow-card-hover transition-all duration-300"
                    >
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                        className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/20"
                      >
                        <f.icon className="h-6 w-6 text-white" />
                      </motion.div>
                      <h4 className="font-bold text-foreground mb-1">{f.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="إجمالي التذاكر" value={stats?.total ?? 0} icon={Inbox} gradient="gradient-primary" delay={0} />
                <StatCard title="جديدة / مفتوحة" value={openCount} icon={AlertTriangle} gradient="bg-warning" delay={0.1} />
                <StatCard title="قيد المعالجة" value={stats?.in_progress ?? 0} icon={Clock} gradient="bg-info" delay={0.2} />
                <StatCard title="تم الحل" value={stats?.resolved ?? 0} icon={CheckCircle2} gradient="bg-success" delay={0.3} />
              </motion.div>

              {/* Quick Actions */}
              {(role === 'admin' || role === 'agent') && (
                <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'تقارير', icon: BarChart3, path: '/admin/reports' },
                    { label: 'المستخدمين', icon: Users, path: '/admin/users' },
                    { label: 'صندوق التذاكر', icon: Inbox, path: '/tickets' },
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
                </motion.div>
              )}

              {/* Ticket List */}
              <motion.div variants={fadeUp} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="بحث في التذاكر..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9 rounded-xl" />
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {statusFilters.map(f => (
                      <motion.button
                        key={f.value}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setStatusFilter(f.value)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                          statusFilter === f.value
                            ? 'gradient-accent text-accent-foreground shadow-md shadow-primary/20'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {f.label}
                      </motion.button>
                    ))}
                  </div>
                  {(role === 'agent' || role === 'admin') && departments.length > 0 && (
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
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center py-20"
                    >
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </motion.div>
                  ) : filteredTickets.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-20 text-muted-foreground"
                    >
                      <Inbox className="h-12 w-12 mb-3 opacity-30" />
                      <p className="font-medium">لا توجد تذاكر</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="list"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="divide-y divide-border/50"
                    >
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
