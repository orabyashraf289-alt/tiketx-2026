import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { fetchTickets, fetchDepartments, fetchServices, TicketStatus, TicketPriority, statusLabels, priorityLabels } from '@/lib/api';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { TicketListItem } from '@/components/TicketListItem';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Inbox, Loader2, Filter, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';

const allStatuses: TicketStatus[] = ['new', 'open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed', 'reopened'];
const allPriorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

export default function TicketsInbox() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: fetchTickets,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => fetchServices(),
  });

  // Determine user's department (for agent tab)
  const isAgentOrAdmin = role === 'agent' || role === 'admin';

  const applyFilters = (list: typeof tickets) => {
    return list.filter((t) => {
      const matchesSearch = !searchQuery || t.title.includes(searchQuery) || t.ticket_number.toString().includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchesDateFrom = !dateFrom || !isBefore(new Date(t.created_at), startOfDay(dateFrom));
      const matchesDateTo = !dateTo || !isAfter(new Date(t.created_at), endOfDay(dateTo));
      return matchesSearch && matchesStatus && matchesPriority && matchesDateFrom && matchesDateTo;
    });
  };

  const unassigned = useMemo(() => applyFilters(tickets.filter(t => !t.assigned_agent_id)), [tickets, searchQuery, statusFilter, priorityFilter, dateFrom, dateTo]);
  const assignedToMe = useMemo(() => applyFilters(tickets.filter(t => t.assigned_agent_id === user?.id)), [tickets, user, searchQuery, statusFilter, priorityFilter, dateFrom, dateTo]);
  
  // Group by department
  const byDepartment = useMemo(() => {
    const filtered = applyFilters(tickets);
    const map: Record<string, typeof tickets> = {};
    filtered.forEach(t => {
      const deptName = t.departments?.name || 'بدون قسم';
      if (!map[deptName]) map[deptName] = [];
      map[deptName].push(t);
    });
    return map;
  }, [tickets, searchQuery, statusFilter, priorityFilter, dateFrom, dateTo]);

  // Group by service
  const byService = useMemo(() => {
    const filtered = applyFilters(tickets);
    const map: Record<string, typeof tickets> = {};
    filtered.forEach(t => {
      const svcName = t.services ? `${t.services.systems?.name || ''} → ${t.services.name}` : 'بدون خدمة';
      if (!map[svcName]) map[svcName] = [];
      map[svcName].push(t);
    });
    return map;
  }, [tickets, searchQuery, statusFilter, priorityFilter, dateFrom, dateTo]);

  const allFiltered = useMemo(() => applyFilters(tickets), [tickets, searchQuery, statusFilter, priorityFilter, dateFrom, dateTo]);

  const renderList = (list: typeof tickets) => {
    if (isLoading) {
      return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Inbox className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">لا توجد تذاكر</p>
        </div>
      );
    }
    return (
      <div className="divide-y">
        {list.map((ticket, i) => (
          <TicketListItem key={ticket.id} ticket={ticket} index={i} onClick={() => navigate(`/tickets/${ticket.id}`)} />
        ))}
      </div>
    );
  };

  const FiltersBar = () => (
    <div className="p-4 border-b space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالعنوان أو رقم التذكرة..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9" />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {allStatuses.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="الأولوية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأولويات</SelectItem>
            {allPriorities.map(p => <SelectItem key={p} value={p}>{priorityLabels[p]}</SelectItem>)}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <CalendarDays className="h-3.5 w-3.5" />
              {dateFrom ? format(dateFrom, 'dd/MM', { locale: ar }) : 'من'}
              {' - '}
              {dateTo ? format(dateTo, 'dd/MM', { locale: ar }) : 'إلى'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">من تاريخ</p>
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ar} />
              <p className="text-xs font-medium text-muted-foreground">إلى تاريخ</p>
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ar} />
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                  مسح التواريخ
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  // Determine default tab
  const defaultTab = isAgentOrAdmin ? 'unassigned' : 'my';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-bold hidden sm:block">صندوق التذاكر</h1>
            </div>
            <NotificationsPopover />
          </header>

          <main className="flex-1 overflow-auto">
            <Tabs defaultValue={defaultTab} className="flex flex-col h-full" dir="rtl">
              <div className="border-b bg-card px-4">
                <TabsList className="bg-transparent h-auto p-0 gap-0">
                  {isAgentOrAdmin && (
                    <TabsTrigger value="unassigned" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm">
                      غير معيّنة
                      <span className="mr-1.5 bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">{unassigned.length}</span>
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="my" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm">
                    {isAgentOrAdmin ? 'معيّنة لي' : 'تذاكري'}
                    <span className="mr-1.5 bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">{assignedToMe.length}</span>
                  </TabsTrigger>
                  {isAgentOrAdmin && (
                    <TabsTrigger value="department" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm">
                      حسب القسم
                    </TabsTrigger>
                  )}
                  {isAgentOrAdmin && (
                    <TabsTrigger value="service" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm">
                      حسب الخدمة
                    </TabsTrigger>
                  )}
                  {role === 'admin' && (
                    <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm">
                      الكل
                      <span className="mr-1.5 bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">{allFiltered.length}</span>
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <div className="rounded-lg border bg-card m-4 md:m-6 flex-1 flex flex-col">
                <FiltersBar />

                {isAgentOrAdmin && (
                  <TabsContent value="unassigned" className="m-0 flex-1">
                    {renderList(unassigned)}
                  </TabsContent>
                )}

                <TabsContent value="my" className="m-0 flex-1">
                  {renderList(assignedToMe)}
                </TabsContent>

                {isAgentOrAdmin && (
                  <TabsContent value="department" className="m-0 flex-1">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                    ) : Object.keys(byDepartment).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Inbox className="h-12 w-12 mb-3 opacity-30" />
                        <p className="font-medium">لا توجد تذاكر</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {Object.entries(byDepartment).map(([dept, deptTickets]) => (
                          <div key={dept}>
                            <div className="px-4 py-2 bg-muted/50 sticky top-0">
                              <span className="text-sm font-semibold">{dept}</span>
                              <span className="text-xs text-muted-foreground mr-2">({deptTickets.length})</span>
                            </div>
                            {deptTickets.map((ticket, i) => (
                              <TicketListItem key={ticket.id} ticket={ticket} index={i} onClick={() => navigate(`/tickets/${ticket.id}`)} />
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                )}

                {isAgentOrAdmin && (
                  <TabsContent value="service" className="m-0 flex-1">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                    ) : Object.keys(byService).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Inbox className="h-12 w-12 mb-3 opacity-30" />
                        <p className="font-medium">لا توجد تذاكر</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {Object.entries(byService).map(([svc, svcTickets]) => (
                          <div key={svc}>
                            <div className="px-4 py-2 bg-muted/50 sticky top-0">
                              <span className="text-sm font-semibold">{svc}</span>
                              <span className="text-xs text-muted-foreground mr-2">({svcTickets.length})</span>
                            </div>
                            {svcTickets.map((ticket, i) => (
                              <TicketListItem key={ticket.id} ticket={ticket} index={i} onClick={() => navigate(`/tickets/${ticket.id}`)} />
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                )}

                {role === 'admin' && (
                  <TabsContent value="all" className="m-0 flex-1">
                    {renderList(allFiltered)}
                  </TabsContent>
                )}
              </div>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
