import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Star, TrendingUp, TrendingDown, Loader2, Download, Smile, Meh, Frown, CalendarDays, Filter, Users, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const COLORS = ['hsl(0, 84%, 60%)', 'hsl(25, 95%, 53%)', 'hsl(38, 92%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(217, 91%, 60%)'];
const STAR_LABELS = ['⭐ سيء جداً', '⭐⭐ سيء', '⭐⭐⭐ مقبول', '⭐⭐⭐⭐ جيد', '⭐⭐⭐⭐⭐ ممتاز'];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } }),
};

const datePresets = [
  { label: 'آخر 7 أيام', getValue: () => { const to = new Date(); const from = subDays(to, 7); return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }; } },
  { label: 'آخر 30 يوم', getValue: () => { const to = new Date(); const from = subDays(to, 30); return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }; } },
  { label: 'آخر 90 يوم', getValue: () => { const to = new Date(); const from = subDays(to, 90); return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }; } },
  { label: 'الكل', getValue: () => ({ from: '', to: '' }) },
];

async function fetchCSATData() {
  const [ratingsRes, ticketsRes, profilesRes] = await Promise.all([
    supabase.from('ticket_ratings').select('id, rating, feedback, created_at, ticket_id, user_id'),
    supabase.from('tickets').select('id, ticket_number, title, assigned_agent_id, service_id, created_at, services(name, systems(name))'),
    supabase.from('profiles').select('id, full_name'),
  ]);

  return {
    ratings: ratingsRes.data || [],
    tickets: ticketsRes.data || [],
    profiles: profilesRes.data || [],
  };
}

export default function CSATAnalytics() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activePreset, setActivePreset] = useState('الكل');

  const { data, isLoading } = useQuery({
    queryKey: ['csat-analytics'],
    queryFn: fetchCSATData,
  });

  const applyPreset = (preset: typeof datePresets[0]) => {
    const val = preset.getValue();
    setDateFrom(val.from);
    setDateTo(val.to);
    setActivePreset(preset.label);
  };

  const filteredRatings = useMemo(() => {
    if (!data) return [];
    return data.ratings.filter((r: any) => {
      if (!dateFrom && !dateTo) return true;
      const d = new Date(r.created_at);
      if (dateFrom && d < startOfDay(new Date(dateFrom))) return false;
      if (dateTo && d > endOfDay(new Date(dateTo))) return false;
      return true;
    });
  }, [data, dateFrom, dateTo]);

  const stats = useMemo(() => {
    if (filteredRatings.length === 0) return null;

    const total = filteredRatings.length;
    const avgRating = filteredRatings.reduce((s: number, r: any) => s + r.rating, 0) / total;
    const distribution = [0, 0, 0, 0, 0];
    filteredRatings.forEach((r: any) => { distribution[r.rating - 1]++; });
    const withFeedback = filteredRatings.filter((r: any) => r.feedback?.trim()).length;
    const satisfied = filteredRatings.filter((r: any) => r.rating >= 4).length;
    const csatPercent = Math.round((satisfied / total) * 100);

    // Trend by day
    const trendMap: Record<string, { date: string; avg: number; count: number; total: number }> = {};
    filteredRatings.forEach((r: any) => {
      const day = r.created_at?.slice(0, 10);
      if (!day) return;
      if (!trendMap[day]) trendMap[day] = { date: day, avg: 0, count: 0, total: 0 };
      trendMap[day].count++;
      trendMap[day].total += r.rating;
    });
    Object.values(trendMap).forEach(d => { d.avg = Math.round((d.total / d.count) * 10) / 10; });
    const trend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    // Agent breakdown
    const agentMap: Record<string, { name: string; total: number; count: number; ratings: number[] }> = {};
    filteredRatings.forEach((r: any) => {
      const ticket = data?.tickets.find((t: any) => t.id === r.ticket_id);
      const agentId = ticket?.assigned_agent_id;
      if (!agentId) return;
      if (!agentMap[agentId]) {
        const name = data?.profiles.find((p: any) => p.id === agentId)?.full_name || 'غير معروف';
        agentMap[agentId] = { name, total: 0, count: 0, ratings: [] };
      }
      agentMap[agentId].total += r.rating;
      agentMap[agentId].count++;
      agentMap[agentId].ratings.push(r.rating);
    });
    const agentStats = Object.values(agentMap)
      .map(a => ({ ...a, avg: Math.round((a.total / a.count) * 10) / 10 }))
      .sort((a, b) => b.avg - a.avg);

    // Service breakdown
    const serviceMap: Record<string, { name: string; total: number; count: number }> = {};
    filteredRatings.forEach((r: any) => {
      const ticket = data?.tickets.find((t: any) => t.id === r.ticket_id);
      const svc = (ticket as any)?.services;
      const svcName = svc ? `${svc.systems?.name || ''} → ${svc.name}` : 'غير محدد';
      const key = svcName;
      if (!serviceMap[key]) serviceMap[key] = { name: svcName, total: 0, count: 0 };
      serviceMap[key].total += r.rating;
      serviceMap[key].count++;
    });
    const serviceStats = Object.values(serviceMap)
      .map(s => ({ ...s, avg: Math.round((s.total / s.count) * 10) / 10 }))
      .sort((a, b) => b.avg - a.avg);

    return { total, avgRating: Math.round(avgRating * 10) / 10, distribution, withFeedback, csatPercent, trend, agentStats, serviceStats };
  }, [filteredRatings, data]);

  const handleExportCSV = () => {
    if (!filteredRatings.length) return;
    const headers = ['التقييم', 'الملاحظات', 'التاريخ', 'رقم التذكرة'];
    const rows = filteredRatings.map((r: any) => {
      const ticket = data?.tickets.find((t: any) => t.id === r.ticket_id);
      return [r.rating, `"${r.feedback || ''}"`, r.created_at?.slice(0, 10), ticket?.ticket_number || ''];
    });
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `csat-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const distributionData = stats?.distribution.map((count, i) => ({
    name: `${i + 1} نجوم`,
    value: count,
    label: STAR_LABELS[i],
  })) || [];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 gap-3 shrink-0 sticky top-0 z-30"
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <Star className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">تحليلات رضا العملاء (CSAT)</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportCSV}>
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">تصدير CSV</span>
              </Button>
              <NotificationsPopover />
            </div>
          </motion.header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Date Filter */}
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Filter className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">فلتر الفترة الزمنية</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {datePresets.map(p => (
                        <Button key={p.label} variant={activePreset === p.label ? 'default' : 'outline'} size="sm" className="text-xs rounded-full" onClick={() => applyPreset(p)}>
                          {p.label}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-3 items-center">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                      <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActivePreset(''); }} className="h-8 text-xs w-36" dir="ltr" />
                      <span className="text-muted-foreground text-xs">إلى</span>
                      <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setActivePreset(''); }} className="h-8 text-xs w-36" dir="ltr" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : !stats || stats.total === 0 ? (
                <Card><CardContent className="py-20 text-center text-muted-foreground">لا توجد تقييمات في هذه الفترة</CardContent></Card>
              ) : (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <Star className="h-5 w-5 mx-auto mb-1.5 text-primary" />
                          <p className="text-3xl font-bold">{stats.avgRating}</p>
                          <p className="text-xs text-muted-foreground">متوسط التقييم</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                    <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1.5">
                            {stats.csatPercent >= 70 ? <Smile className="h-5 w-5 text-success" /> : stats.csatPercent >= 40 ? <Meh className="h-5 w-5 text-warning" /> : <Frown className="h-5 w-5 text-destructive" />}
                          </div>
                          <p className="text-3xl font-bold">{stats.csatPercent}%</p>
                          <p className="text-xs text-muted-foreground">نسبة الرضا (CSAT)</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                    <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <MessageSquare className="h-5 w-5 mx-auto mb-1.5 text-info" />
                          <p className="text-3xl font-bold">{stats.total}</p>
                          <p className="text-xs text-muted-foreground">إجمالي التقييمات</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                    <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <Users className="h-5 w-5 mx-auto mb-1.5 text-accent" />
                          <p className="text-3xl font-bold">{stats.withFeedback}</p>
                          <p className="text-xs text-muted-foreground">تقييمات مع ملاحظات</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Rating Distribution */}
                    <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show">
                      <Card>
                        <CardHeader><CardTitle className="text-sm">توزيع التقييمات</CardTitle></CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={distributionData}>
                              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Bar dataKey="value" name="عدد التقييمات" radius={[6, 6, 0, 0]}>
                                {distributionData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* CSAT Trend */}
                    {stats.trend.length > 1 && (
                      <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show">
                        <Card>
                          <CardHeader><CardTitle className="text-sm">اتجاه التقييمات بمرور الوقت</CardTitle></CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <AreaChart data={stats.trend}>
                                <defs>
                                  <linearGradient id="gradCsat" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(217, 72%, 50%)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(217, 72%, 50%)" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={v => v.slice(5)} />
                                <YAxis tick={{ fontSize: 10 }} domain={[0, 5]} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <Area type="monotone" dataKey="avg" name="متوسط التقييم" stroke="hsl(217, 72%, 50%)" fill="url(#gradCsat)" strokeWidth={2} />
                                <Line type="monotone" dataKey="count" name="عدد التقييمات" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={false} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </div>

                  {/* Agent & Service Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {stats.agentStats.length > 0 && (
                      <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show">
                        <Card>
                          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-primary" />تقييم الوكلاء</CardTitle></CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {stats.agentStats.map((agent, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                                      {agent.name.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{agent.name}</p>
                                      <p className="text-[10px] text-muted-foreground">{agent.count} تقييم</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-0.5">
                                      {Array.from({ length: 5 }).map((_, si) => (
                                        <Star key={si} className={cn('h-3 w-3', si < Math.round(agent.avg) ? 'text-primary fill-primary' : 'text-muted')} />
                                      ))}
                                    </div>
                                    <Badge variant="outline" className={cn('text-xs', agent.avg >= 4 ? 'bg-success/15 text-success' : agent.avg >= 3 ? 'bg-warning/15 text-warning' : 'bg-destructive/15 text-destructive')}>
                                      {agent.avg}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {stats.serviceStats.length > 0 && (
                      <motion.div custom={8} variants={fadeUp} initial="hidden" animate="show">
                        <Card>
                          <CardHeader><CardTitle className="text-sm">تقييم حسب الخدمة</CardTitle></CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={Math.max(200, stats.serviceStats.length * 45)}>
                              <BarChart data={stats.serviceStats} layout="vertical">
                                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={140} />
                                <Tooltip />
                                <Bar dataKey="avg" name="متوسط التقييم" fill="hsl(217, 72%, 50%)" radius={[0, 6, 6, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </div>

                  {/* Recent Feedback */}
                  {filteredRatings.filter((r: any) => r.feedback?.trim()).length > 0 && (
                    <motion.div custom={9} variants={fadeUp} initial="hidden" animate="show">
                      <Card>
                        <CardHeader><CardTitle className="text-sm">آخر الملاحظات</CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-3 max-h-[300px] overflow-auto">
                            {filteredRatings
                              .filter((r: any) => r.feedback?.trim())
                              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                              .slice(0, 20)
                              .map((r: any) => {
                                const ticket = data?.tickets.find((t: any) => t.id === r.ticket_id);
                                return (
                                  <div key={r.id} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-1">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                          <Star key={i} className={cn('h-3 w-3', i < r.rating ? 'text-primary fill-primary' : 'text-muted')} />
                                        ))}
                                      </div>
                                      <span className="text-[10px] text-muted-foreground">{r.created_at?.slice(0, 10)}</span>
                                    </div>
                                    <p className="text-sm">{r.feedback}</p>
                                    {ticket && <p className="text-[10px] text-muted-foreground mt-1">تذكرة #{ticket.ticket_number}: {ticket.title}</p>}
                                  </div>
                                );
                              })}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
