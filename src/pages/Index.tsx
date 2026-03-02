import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTickets, fetchTicketStats, fetchDepartments, TicketStatus, TicketPriority, Department } from '@/lib/api';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { StatsCard } from '@/components/StatsCard';
import { TicketListItem } from '@/components/TicketListItem';
import { Input } from '@/components/ui/input';
import { Inbox, Clock, CheckCircle2, AlertTriangle, Bell, Search, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { NotificationsPopover } from '@/components/NotificationsPopover';

const statusFilters: { label: string; value: TicketStatus | 'all' }[] = [
  { label: 'الكل', value: 'all' },
  { label: 'جديدة', value: 'new' },
  { label: 'مفتوحة', value: 'open' },
  { label: 'قيد المعالجة', value: 'in_progress' },
  { label: 'بانتظار العميل', value: 'waiting_on_customer' },
  { label: 'تم الحل', value: 'resolved' },
  { label: 'مغلقة', value: 'closed' },
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 gap-4 shrink-0">
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
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatsCard title="إجمالي التذاكر" value={stats?.total ?? 0} icon={Inbox} variant="primary" />
              <StatsCard title="جديدة / مفتوحة" value={(stats?.new ?? 0) + (stats?.open ?? 0)} icon={AlertTriangle} variant="warning" />
              <StatsCard title="قيد المعالجة" value={stats?.in_progress ?? 0} icon={Clock} variant="default" />
              <StatsCard title="تم الحل" value={stats?.resolved ?? 0} icon={CheckCircle2} variant="success" />
            </div>

            {/* Ticket List */}
            <div className="rounded-lg border bg-card">
              <div className="p-4 border-b">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="بحث في التذاكر..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9" />
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {statusFilters.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setStatusFilter(f.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        statusFilter === f.value
                          ? 'gradient-accent text-accent-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {f.label}
                    </button>
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
                <div className="divide-y">
                  {filteredTickets.map((ticket, i) => (
                    <TicketListItem key={ticket.id} ticket={ticket} index={i} onClick={() => navigate(`/tickets/${ticket.id}`)} />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
