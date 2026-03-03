import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend, LineChart, Line
} from 'recharts';
import { BarChart3, Download, PieChart as PieIcon, TrendingUp, Activity } from 'lucide-react';
import { statusLabels, TicketStatus } from '@/lib/api';
import { motion } from 'framer-motion';

const COLORS = [
  'hsl(152, 55%, 38%)', 'hsl(160, 60%, 42%)', 'hsl(38, 92%, 50%)',
  'hsl(199, 89%, 48%)', 'hsl(0, 72%, 51%)', 'hsl(280, 60%, 50%)', 'hsl(45, 90%, 48%)'
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

interface DashboardChartsProps {
  report: any;
  trendData: Array<{ date: string; created: number; resolved: number }>;
}

export function exportToCSV(report: any) {
  if (!report?.rawTickets?.length) return;
  const headers = ['رقم التذكرة', 'العنوان', 'الحالة', 'الأولوية', 'القسم', 'النظام', 'الخدمة', 'تاريخ الإنشاء', 'تاريخ الحل', 'ساعات الحل'];
  const rows = report.rawTickets.map((t: any) => [
    t.ticket_number, `"${t.title}"`, t.status, t.priority, t.department, t.system, t.service,
    t.created_at?.slice(0, 10), t.resolved_at?.slice(0, 10) || '', t.resolutionHours ?? ''
  ]);
  const bom = '\uFEFF';
  const csv = bom + [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `tickets-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
}

export function DashboardCharts({ report, trendData }: DashboardChartsProps) {
  const statusPieData = useMemo(() => {
    if (!report?.byStatus) return [];
    return Object.entries(report.byStatus).map(([k, v]) => ({
      name: statusLabels[k as TicketStatus] || k,
      value: v as number,
    })).filter(d => d.value > 0);
  }, [report]);

  const sourceData = useMemo(() => {
    if (!report?.bySystem) return [];
    return Object.entries(report.bySystem).map(([k, v]) => ({
      name: k,
      value: v as number,
    })).filter(d => d.value > 0);
  }, [report]);

  const priorityData = useMemo(() => {
    if (!report?.byPriority) return [];
    const labels: Record<string, string> = { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة' };
    return Object.entries(report.byPriority).map(([k, v]) => ({
      name: labels[k] || k,
      value: v as number,
    })).filter(d => d.value > 0);
  }, [report]);

  const slaServiceData = useMemo(() => {
    if (!report?.slaByService) return [];
    return Object.entries(report.slaByService).map(([k, v]: [string, any]) => ({
      name: k,
      compliance: v.compliance,
      breaches: v.breaches,
    }));
  }, [report]);

  return (
    <div className="space-y-4">
      {/* Row 1: Trend Chart */}
      <motion.div variants={fadeUp}>
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              اتجاه التذاكر اليومي
            </CardTitle>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportToCSV(report)}>
              <Download className="h-3.5 w-3.5" />
              تصدير CSV
            </Button>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(152, 55%, 38%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(152, 55%, 38%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="created" name="تم إنشاؤها" stroke="hsl(152, 55%, 38%)" fill="url(#gradCreated)" strokeWidth={2} />
                  <Area type="monotone" dataKey="resolved" name="تم حلها" stroke="hsl(199, 89%, 48%)" fill="url(#gradResolved)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">لا توجد بيانات في هذه الفترة</div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Row 2: Pie + Priority + Source */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-primary" />
                حسب الحالة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {statusPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">لا توجد بيانات</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-warning" />
                حسب الأولوية
              </CardTitle>
            </CardHeader>
            <CardContent>
              {priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={priorityData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
                    <Bar dataKey="value" name="التذاكر" radius={[0, 6, 6, 0]}>
                      {priorityData.map((_, i) => (
                        <Cell key={i} fill={['hsl(152, 55%, 42%)', 'hsl(38, 92%, 50%)', 'hsl(25, 95%, 53%)', 'hsl(0, 72%, 51%)'][i] || COLORS[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">لا توجد بيانات</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-info" />
                حسب المصدر
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sourceData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
                    <Bar dataKey="value" name="التذاكر" fill="hsl(160, 60%, 42%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">لا توجد بيانات</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Row 3: SLA by Service */}
      {slaServiceData.length > 0 && (
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">التزام SLA حسب الخدمة</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={slaServiceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="compliance" name="نسبة الالتزام %" fill="hsl(152, 55%, 42%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
