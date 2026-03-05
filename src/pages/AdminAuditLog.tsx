import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { motion } from 'framer-motion';
import { Search, Shield, FileText, Filter, Download, Clock, User, Activity } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';

const eventTypeLabels: Record<string, string> = {
  status_changed: 'تغيير حالة',
  assigned: 'تعيين وكيل',
  priority_changed: 'تغيير أولوية',
  department_changed: 'تغيير قسم',
  comment_added: 'إضافة تعليق',
  attachment_added: 'إضافة مرفق',
  created: 'إنشاء تذكرة',
  resolved: 'حل تذكرة',
  closed: 'إغلاق تذكرة',
  reopened: 'إعادة فتح',
};

const eventTypeColors: Record<string, string> = {
  created: 'bg-green-500/10 text-green-700 dark:text-green-400',
  status_changed: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  assigned: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  priority_changed: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  resolved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  closed: 'bg-muted text-muted-foreground',
  reopened: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  comment_added: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  attachment_added: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  department_changed: 'bg-pink-500/10 text-pink-700 dark:text-pink-400',
};

export default function AdminAuditLog() {
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', dateRange],
    queryFn: async () => {
      const since = subDays(new Date(), parseInt(dateRange)).toISOString();
      const { data } = await supabase
        .from('audit_logs')
        .select('*, profiles:user_id(full_name, email), tickets:ticket_id(ticket_number, title)')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(500);
      return data || [];
    },
  });

  const filtered = logs.filter((log: any) => {
    if (eventFilter !== 'all' && log.event_type !== eventFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        log.action?.toLowerCase().includes(s) ||
        log.profiles?.full_name?.toLowerCase().includes(s) ||
        log.profiles?.email?.toLowerCase().includes(s) ||
        log.tickets?.title?.toLowerCase().includes(s) ||
        String(log.tickets?.ticket_number).includes(s)
      );
    }
    return true;
  });

  // Stats
  const eventCounts = logs.reduce((acc: Record<string, number>, l: any) => {
    const t = l.event_type || 'other';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const uniqueUsers = new Set(logs.map((l: any) => l.user_id)).size;

  const exportCSV = () => {
    const headers = ['التاريخ', 'المستخدم', 'الحدث', 'الإجراء', 'التذكرة', 'القيمة القديمة', 'القيمة الجديدة'];
    const rows = filtered.map((l: any) => [
      format(new Date(l.created_at), 'yyyy-MM-dd HH:mm'),
      l.profiles?.full_name || '',
      eventTypeLabels[l.event_type] || l.event_type || '',
      l.action,
      l.tickets?.ticket_number || '',
      l.old_value || '',
      l.new_value || '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <motion.header
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 gap-3 shrink-0 sticky top-0 z-30"
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">سجل التدقيق</h1>
              <Badge variant="secondary" className="text-xs">{filtered.length} سجل</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
                <Download className="h-4 w-4" />
                تصدير CSV
              </Button>
              <NotificationsPopover />
            </div>
          </motion.header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="rounded-2xl">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{logs.length}</p>
                      <p className="text-xs text-muted-foreground">إجمالي الأحداث</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{uniqueUsers}</p>
                      <p className="text-xs text-muted-foreground">مستخدم نشط</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{eventCounts['created'] || 0}</p>
                      <p className="text-xs text-muted-foreground">تذاكر أُنشئت</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{eventCounts['status_changed'] || 0}</p>
                      <p className="text-xs text-muted-foreground">تغيير حالة</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="rounded-2xl">
                <CardContent className="p-4 flex flex-wrap gap-3 items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في السجلات..." className="pr-10" />
                  </div>
                  <Select value={eventFilter} onValueChange={setEventFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 ml-2" />
                      <SelectValue placeholder="نوع الحدث" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأحداث</SelectItem>
                      {Object.entries(eventTypeLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-36">
                      <Clock className="h-4 w-4 ml-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">آخر 7 أيام</SelectItem>
                      <SelectItem value="30">آخر 30 يوم</SelectItem>
                      <SelectItem value="90">آخر 90 يوم</SelectItem>
                      <SelectItem value="365">آخر سنة</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Logs Table */}
              <Card className="rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">المستخدم</TableHead>
                      <TableHead className="text-right">الحدث</TableHead>
                      <TableHead className="text-right">التذكرة</TableHead>
                      <TableHead className="text-right">التفاصيل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">جاري التحميل...</TableCell></TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">لا توجد سجلات</TableCell></TableRow>
                    ) : (
                      filtered.slice(0, 200).map((log: any) => (
                        <TableRow key={log.id} className="hover:bg-muted/20">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: ar })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                {log.profiles?.full_name?.charAt(0) || '?'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{log.profiles?.full_name || 'غير معروف'}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{log.profiles?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${eventTypeColors[log.event_type] || 'bg-muted text-muted-foreground'}`} variant="secondary">
                              {eventTypeLabels[log.event_type] || log.event_type || log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.tickets ? (
                              <a href={`/tickets/${log.ticket_id}`} className="text-sm text-primary hover:underline">
                                #{log.tickets.ticket_number}
                              </a>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            {log.old_value && log.new_value ? (
                              <div className="text-xs space-y-0.5">
                                <span className="text-destructive line-through">{log.old_value}</span>
                                <span className="mx-1">←</span>
                                <span className="text-green-600 dark:text-green-400">{log.new_value}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground truncate block">{log.action}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {filtered.length > 200 && (
                  <div className="p-3 text-center text-xs text-muted-foreground border-t">
                    عرض أول 200 سجل من أصل {filtered.length}
                  </div>
                )}
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
