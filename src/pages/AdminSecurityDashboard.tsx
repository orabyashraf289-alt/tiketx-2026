import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, AlertTriangle, Activity, Lock, Eye, UserX, KeyRound, Download, Bell } from 'lucide-react';
import { format, subDays, differenceInMinutes } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AdminSecurityDashboard() {
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['security-audit-logs'],
    queryFn: async () => {
      const since = subDays(new Date(), 30).toISOString();
      const { data } = await supabase
        .from('audit_logs')
        .select('*, profiles:user_id(full_name, email)')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1000);
      return data || [];
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['security-users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*, user_roles(role)');
      return data || [];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['security-roles'],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('*');
      return data || [];
    },
  });

  // Analytics
  const totalUsers = users.length;
  const activeUsers = users.filter((u: any) => u.is_active).length;
  const inactiveUsers = totalUsers - activeUsers;
  const adminCount = roles.filter((r: any) => r.role === 'admin').length;
  const agentCount = roles.filter((r: any) => r.role === 'agent').length;
  const developerCount = roles.filter((r: any) => r.role === 'developer').length;
  const requesterCount = roles.filter((r: any) => r.role === 'requester').length;

  // Activity by day
  const activityByDay = auditLogs.reduce((acc: Record<string, number>, log: any) => {
    const day = format(new Date(log.created_at), 'MM/dd');
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  const activityChart = Object.entries(activityByDay)
    .map(([day, count]) => ({ day, count }))
    .reverse()
    .slice(-14);

  // Event type distribution
  const eventDist = auditLogs.reduce((acc: Record<string, number>, log: any) => {
    const t = log.event_type || 'other';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const eventPieData = Object.entries(eventDist)
    .map(([name, value]) => ({ name: eventLabels[name] || name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Top users by activity
  const userActivity = auditLogs.reduce((acc: Record<string, { name: string; count: number }>, log: any) => {
    const id = log.user_id;
    if (!acc[id]) acc[id] = { name: log.profiles?.full_name || 'غير معروف', count: 0 };
    acc[id].count++;
    return acc;
  }, {});
  const topUsers = Object.values(userActivity).sort((a, b) => b.count - a.count).slice(0, 8);

  // Role distribution
  const roleDistData = [
    { name: 'أدمن', value: adminCount, fill: COLORS[0] },
    { name: 'دعم فني', value: agentCount, fill: COLORS[1] },
    { name: 'مطور', value: developerCount, fill: COLORS[2] },
    { name: 'عميل', value: requesterCount, fill: COLORS[3] },
  ];

  // Security alerts (real-time suspicious activity detection)
  const alerts: { type: 'warning' | 'info' | 'danger'; message: string; time?: string }[] = [];
  if (adminCount > 3) alerts.push({ type: 'warning', message: `عدد كبير من المشرفين (${adminCount}) - يُنصح بتقليلهم` });
  if (inactiveUsers > 5) alerts.push({ type: 'info', message: `${inactiveUsers} حساب معطّل - يُنصح بمراجعتها` });
  const usersNoDept = users.filter((u: any) => !u.department_id && u.user_roles?.[0]?.role !== 'requester').length;
  if (usersNoDept > 0) alerts.push({ type: 'info', message: `${usersNoDept} موظف بدون قسم محدد` });

  // Suspicious activity detection
  const now = new Date();
  const recentLogs = auditLogs.filter((l: any) => differenceInMinutes(now, new Date(l.created_at)) <= 60);
  // High volume from single user in last hour
  const userHourCounts: Record<string, { count: number; name: string }> = {};
  recentLogs.forEach((l: any) => {
    if (!userHourCounts[l.user_id]) userHourCounts[l.user_id] = { count: 0, name: l.profiles?.full_name || 'غير معروف' };
    userHourCounts[l.user_id].count++;
  });
  Object.values(userHourCounts).forEach(u => {
    if (u.count > 50) alerts.push({ type: 'danger', message: `نشاط مكثف: ${u.name} أجرى ${u.count} عملية في الساعة الأخيرة`, time: format(now, 'HH:mm') });
  });
  // Multiple status changes on same ticket
  const ticketChanges: Record<string, number> = {};
  recentLogs.filter((l: any) => l.event_type === 'status_changed').forEach((l: any) => {
    ticketChanges[l.ticket_id] = (ticketChanges[l.ticket_id] || 0) + 1;
  });
  Object.entries(ticketChanges).forEach(([tid, count]) => {
    if (count > 5) alerts.push({ type: 'warning', message: `تذكرة تغيّرت حالتها ${count} مرات في الساعة الأخيرة` });
  });

  // Realtime subscription for new audit events
  const { toast } = useToast();
  useEffect(() => {
    const channel = supabase
      .channel('security-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        const evt = payload.new as any;
        if (evt.event_type === 'assigned' || evt.event_type === 'status_changed') {
          toast({ title: '🔔 نشاط جديد', description: `${evt.action}` });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // PDF Export
  const exportSecurityPDF = () => {
    const alertsHtml = alerts.map(a => `<div class="alert ${a.type}"><span class="icon">${a.type === 'danger' ? '🔴' : a.type === 'warning' ? '🟠' : '🔵'}</span> ${a.message}</div>`).join('');
    const topUsersHtml = topUsers.map((u, i) => `<tr><td>${i + 1}</td><td>${u.name}</td><td>${u.count}</td></tr>`).join('');
    const roleHtml = roleDistData.map(r => `<tr><td>${r.name}</td><td>${r.value}</td></tr>`).join('');
    const eventHtml = eventPieData.map(e => `<tr><td>${e.name}</td><td>${e.value}</td></tr>`).join('');

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>تقرير الأمان والحوكمة</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Tajawal',sans-serif;background:#fff;color:#1a2e28;padding:40px;font-size:13px}
.header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #2d8b6e;padding-bottom:20px;margin-bottom:30px}
.header h1{font-size:24px;color:#2d8b6e}
.header .meta{text-align:left;color:#666;font-size:11px}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:30px}
.kpi-card{background:#f0faf5;border:1px solid #d0e8dd;border-radius:10px;padding:16px;text-align:center}
.kpi-card .value{font-size:28px;font-weight:800;color:#2d8b6e}
.kpi-card .label{font-size:11px;color:#666;margin-top:4px}
.section{margin-bottom:24px}
.section h2{font-size:16px;color:#2d8b6e;margin-bottom:12px;border-bottom:1px solid #e0e0e0;padding-bottom:6px}
table{width:100%;border-collapse:collapse;font-size:12px}
th,td{padding:8px 12px;text-align:right;border-bottom:1px solid #eee}
th{background:#f0faf5;font-weight:700;color:#2d8b6e}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.alert{padding:10px 14px;border-radius:8px;margin-bottom:8px;font-size:12px;display:flex;align-items:center;gap:8px}
.alert.danger{background:#fff5f5;border:1px solid #fed7d7;color:#c53030}
.alert.warning{background:#fffff0;border:1px solid #feebc8;color:#c05621}
.alert.info{background:#ebf8ff;border:1px solid #bee3f8;color:#2b6cb0}
.footer{margin-top:40px;text-align:center;color:#999;font-size:10px;border-top:1px solid #eee;padding-top:16px}
@media print{body{padding:20px}}
</style></head><body>
<div class="header"><div><h1>🛡️ تقرير الأمان والحوكمة</h1><p style="color:#888;font-size:12px">آخر 30 يوم</p></div>
<div class="meta"><p>تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</p><p>TicketFlow System</p></div></div>

<div class="kpi-grid">
<div class="kpi-card"><div class="value">${totalUsers}</div><div class="label">إجمالي المستخدمين</div></div>
<div class="kpi-card"><div class="value">${activeUsers}</div><div class="label">حسابات نشطة</div></div>
<div class="kpi-card"><div class="value" style="color:#e53e3e">${inactiveUsers}</div><div class="label">حسابات معطّلة</div></div>
<div class="kpi-card"><div class="value">${auditLogs.length}</div><div class="label">أحداث التدقيق</div></div>
</div>

${alerts.length > 0 ? `<div class="section"><h2>⚠️ التنبيهات الأمنية</h2>${alertsHtml}</div>` : ''}

<div class="two-col">
<div class="section"><h2>توزيع الأدوار</h2><table><thead><tr><th>الدور</th><th>العدد</th></tr></thead><tbody>${roleHtml}</tbody></table></div>
<div class="section"><h2>توزيع الأحداث</h2><table><thead><tr><th>الحدث</th><th>العدد</th></tr></thead><tbody>${eventHtml}</tbody></table></div>
</div>

<div class="section"><h2>أكثر المستخدمين نشاطاً</h2><table><thead><tr><th>#</th><th>المستخدم</th><th>عدد الأحداث</th></tr></thead><tbody>${topUsersHtml}</tbody></table></div>

<div class="footer">تم إنشاء هذا التقرير آلياً بواسطة نظام TicketFlow — ${new Date().toISOString()}</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500); }
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
              <ShieldCheck className="h-5 w-5 text-primary" />
             <h1 className="text-lg font-bold text-foreground">لوحة الأمان والحوكمة</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportSecurityPDF} className="gap-1.5">
                <Download className="h-4 w-4" />
                تصدير PDF
              </Button>
              <NotificationsPopover />
            </div>
          </motion.header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Security Alerts */}
              {alerts.length > 0 && (
                <div className="space-y-2">
                  {alerts.map((a, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                      <Card className={`rounded-xl border-r-4 ${a.type === 'danger' ? 'border-r-destructive' : a.type === 'warning' ? 'border-r-orange-500' : 'border-r-blue-500'}`}>
                        <CardContent className="p-3 flex items-center gap-3">
                          <AlertTriangle className={`h-5 w-5 shrink-0 ${a.type === 'danger' ? 'text-destructive' : a.type === 'warning' ? 'text-orange-500' : 'text-blue-500'}`} />
                          <p className="text-sm text-foreground">{a.message}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Users, label: 'إجمالي المستخدمين', value: totalUsers, color: 'text-primary' },
                  { icon: Lock, label: 'حسابات نشطة', value: activeUsers, color: 'text-green-600 dark:text-green-400' },
                  { icon: UserX, label: 'حسابات معطّلة', value: inactiveUsers, color: 'text-destructive' },
                  { icon: Activity, label: 'أحداث (30 يوم)', value: auditLogs.length, color: 'text-blue-600 dark:text-blue-400' },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <Card className="rounded-2xl">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                          <s.icon className={`h-5 w-5 ${s.color}`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{s.value}</p>
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Activity Timeline */}
                <Card className="rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      نشاط التدقيق (14 يوم)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityChart}>
                        <defs>
                          <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#actGrad)" strokeWidth={2} name="أحداث" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Role Distribution */}
                <Card className="rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-primary" />
                      توزيع الأدوار
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={roleDistData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {roleDistData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Event Types */}
                <Card className="rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      توزيع الأحداث
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={eventPieData} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} name="عدد" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Active Users */}
                <Card className="rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      أكثر المستخدمين نشاطاً
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {topUsers.map((u, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{u.name}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">{u.count} حدث</Badge>
                        </div>
                      ))}
                      {topUsers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const eventLabels: Record<string, string> = {
  status_changed: 'تغيير حالة',
  assigned: 'تعيين',
  priority_changed: 'تغيير أولوية',
  department_changed: 'تغيير قسم',
  comment_added: 'تعليق',
  attachment_added: 'مرفق',
  created: 'إنشاء',
  resolved: 'حل',
  closed: 'إغلاق',
  reopened: 'إعادة فتح',
};
