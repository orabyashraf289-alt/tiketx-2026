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
import { Search, Inbox, Loader2, Filter, CalendarDays, Plus, X, Bookmark, LayoutGrid, List, TableProperties } from 'lucide-react';
import { TicketTableView } from '@/components/TicketTableView';
import { useNavigate } from 'react-router-dom';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeTickets } from '@/hooks/useRealtimeTickets';
import { KanbanBoard } from '@/components/KanbanBoard';

const allStatuses: TicketStatus[] = ['new', 'open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed', 'reopened'];
const allPriorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const staggerList = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const listItem = {
  hidden: { opacity: 0, x: 15 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

interface SavedFilter {
  name: string;
  status: TicketStatus | 'all';
  priority: TicketPriority | 'all';
}

export default function TicketsInbox() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  // Enable Realtime
  useRealtimeTickets();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'table' | 'kanban'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ticket-saved-filters') || '[]');
    } catch { return []; }
  });

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

  const isAgentOrAdmin = role === 'agent' || role === 'admin';

  const applyFilters = (list: typeof tickets) => {
    return list.filter((t) => {
      const matchesSearch = !searchQuery || t.title.includes(searchQuery) || t.ticket_number.toString().includes(searchQuery) || t.code?.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchesDateFrom = !dateFrom || !isBefore(new Date(t.created_at), startOfDay(dateFrom));
      const matchesDateTo = !dateTo || !isAfter(new Date(t.created_at), endOfDay(dateTo));
      return matchesSearch && matchesStatus && matchesPriority && matchesDateFrom && matchesDateTo;
    });
  };

  const unassigned = useMemo(() => applyFilters(tickets.filter(t => !t.assigned_agent_id)), [tickets, searchQuery, statusFilter, priorityFilter, dateFrom, dateTo]);
  const assignedToMe = useMemo(() => applyFilters(tickets.filter(t => t.assigned_agent_id === user?.id)), [tickets, user, searchQuery, statusFilter, priorityFilter, dateFrom, dateTo]);
  
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

  const activeFiltersCount = [statusFilter !== 'all', priorityFilter !== 'all', !!dateFrom, !!dateTo].filter(Boolean).length;

  const saveCurrentFilter = () => {
    const name = `فلتر ${savedFilters.length + 1}`;
    const newFilter: SavedFilter = { name, status: statusFilter, priority: priorityFilter };
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('ticket-saved-filters', JSON.stringify(updated));
  };

  const applySavedFilter = (filter: SavedFilter) => {
    setStatusFilter(filter.status);
    setPriorityFilter(filter.priority);
  };

  const removeSavedFilter = (index: number) => {
    const updated = savedFilters.filter((_, i) => i !== index);
    setSavedFilters(updated);
    localStorage.setItem('ticket-saved-filters', JSON.stringify(updated));
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchQuery('');
  };

  const renderList = (list: typeof tickets) => {
    if (isLoading) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </motion.div>
      );
    }
    if (list.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-muted-foreground"
        >
          <Inbox className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">لا توجد تذاكر</p>
        </motion.div>
      );
    }
    if (viewMode === 'table') {
      return (
        <TicketTableView
          tickets={list}
          onTicketClick={(id) => navigate(`/tickets/${id}`)}
          page={currentPage}
          onPageChange={setCurrentPage}
        />
      );
    }
    return (
      <motion.div variants={staggerList} initial="hidden" animate="visible" className="divide-y divide-border/50">
        {list.map((ticket, i) => (
          <motion.div key={ticket.id} variants={listItem}>
            <TicketListItem ticket={ticket} index={i} onClick={() => navigate(`/tickets/${ticket.id}`)} />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const FiltersBar = () => (
    <motion.div variants={fadeUp} className="p-4 border-b border-border/50 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالعنوان أو الرقم أو الكود..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9 rounded-xl" />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-36 rounded-xl">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {allStatuses.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
          <SelectTrigger className="w-32 rounded-xl">
            <SelectValue placeholder="الأولوية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأولويات</SelectItem>
            {allPriorities.map(p => <SelectItem key={p} value={p}>{priorityLabels[p]}</SelectItem>)}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl">
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

        {/* Save filter */}
        <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl" onClick={saveCurrentFilter}>
          <Bookmark className="h-3.5 w-3.5" />
          حفظ الفلتر
        </Button>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-destructive" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />
            مسح ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Saved filters */}
      {savedFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground font-medium">فلاتر محفوظة:</span>
          {savedFilters.map((f, i) => (
            <div key={i} className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-1">
              <button className="text-[10px] font-medium" onClick={() => applySavedFilter(f)}>{f.name}</button>
              <button onClick={() => removeSavedFilter(i)} className="hover:text-destructive">
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );

  const defaultTab = isAgentOrAdmin ? 'unassigned' : 'my';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 gap-4 shrink-0 sticky top-0 z-30"
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-bold hidden sm:block text-foreground">صندوق التذاكر</h1>
              {/* Live indicator */}
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                <span className="text-[10px] text-success font-medium hidden sm:inline">مباشر</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              {isAgentOrAdmin && (
                <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
                  <button onClick={() => { setViewMode('list'); setCurrentPage(1); }} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                    <List className="h-4 w-4" />
                  </button>
                  <button onClick={() => { setViewMode('table'); setCurrentPage(1); }} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                    <TableProperties className="h-4 w-4" />
                  </button>
                  <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
              )}
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
            >
              {viewMode === 'kanban' && isAgentOrAdmin ? (
                <motion.div variants={fadeUp} className="p-4 md:p-6">
                  <KanbanBoard tickets={allFiltered} isAdmin={isAgentOrAdmin} />
                </motion.div>
              ) : (
              <Tabs defaultValue={defaultTab} className="flex flex-col h-full" dir="rtl">
                <motion.div variants={fadeUp} className="border-b border-border/50 bg-card/60 backdrop-blur-sm px-4">
                  <TabsList className="bg-transparent h-auto p-0 gap-0">
                    {isAgentOrAdmin && (
                      <TabsTrigger value="unassigned" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm transition-all duration-200">
                        غير معيّنة
                        <span className="mr-1.5 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">{unassigned.length}</span>
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="my" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm transition-all duration-200">
                      {isAgentOrAdmin ? 'معيّنة لي' : 'تذاكري'}
                      <span className="mr-1.5 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">{assignedToMe.length}</span>
                    </TabsTrigger>
                    {isAgentOrAdmin && (
                      <TabsTrigger value="department" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm transition-all duration-200">
                        حسب القسم
                      </TabsTrigger>
                    )}
                    {isAgentOrAdmin && (
                      <TabsTrigger value="service" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm transition-all duration-200">
                        حسب الخدمة
                      </TabsTrigger>
                    )}
                    {role === 'admin' && (
                      <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm transition-all duration-200">
                        الكل
                        <span className="mr-1.5 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">{allFiltered.length}</span>
                      </TabsTrigger>
                    )}
                  </TabsList>
                </motion.div>

                <motion.div variants={fadeUp} className="rounded-2xl border border-border/50 bg-card m-4 md:m-6 flex-1 flex flex-col overflow-hidden shadow-card">
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
                        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                      ) : Object.keys(byDepartment).length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                          <Inbox className="h-12 w-12 mb-3 opacity-30" />
                          <p className="font-medium">لا توجد تذاكر</p>
                        </motion.div>
                      ) : (
                        <motion.div variants={staggerList} initial="hidden" animate="visible" className="divide-y divide-border/50">
                          {Object.entries(byDepartment).map(([dept, deptTickets]) => (
                            <motion.div key={dept} variants={listItem}>
                              <div className="px-4 py-2.5 bg-muted/30 sticky top-0 backdrop-blur-sm border-b border-border/30">
                                <span className="text-sm font-semibold text-foreground">{dept}</span>
                                <span className="text-xs text-muted-foreground mr-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full">({deptTickets.length})</span>
                              </div>
                              {deptTickets.map((ticket, i) => (
                                <TicketListItem key={ticket.id} ticket={ticket} index={i} onClick={() => navigate(`/tickets/${ticket.id}`)} />
                              ))}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </TabsContent>
                  )}

                  {isAgentOrAdmin && (
                    <TabsContent value="service" className="m-0 flex-1">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                      ) : Object.keys(byService).length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                          <Inbox className="h-12 w-12 mb-3 opacity-30" />
                          <p className="font-medium">لا توجد تذاكر</p>
                        </motion.div>
                      ) : (
                        <motion.div variants={staggerList} initial="hidden" animate="visible" className="divide-y divide-border/50">
                          {Object.entries(byService).map(([svc, svcTickets]) => (
                            <motion.div key={svc} variants={listItem}>
                              <div className="px-4 py-2.5 bg-muted/30 sticky top-0 backdrop-blur-sm border-b border-border/30">
                                <span className="text-sm font-semibold text-foreground">{svc}</span>
                                <span className="text-xs text-muted-foreground mr-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full">({svcTickets.length})</span>
                              </div>
                              {svcTickets.map((ticket, i) => (
                                <TicketListItem key={ticket.id} ticket={ticket} index={i} onClick={() => navigate(`/tickets/${ticket.id}`)} />
                              ))}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </TabsContent>
                  )}

                  {role === 'admin' && (
                    <TabsContent value="all" className="m-0 flex-1">
                      {renderList(allFiltered)}
                    </TabsContent>
                  )}
                </motion.div>
              </Tabs>
              )}
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
