import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchReportData, statusLabels, priorityLabels } from '@/lib/api';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart3, Clock, ShieldCheck, AlertTriangle, Download, Timer, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['hsl(152, 55%, 38%)', 'hsl(160, 60%, 42%)', 'hsl(38, 92%, 50%)', 'hsl(199, 89%, 48%)', 'hsl(0, 72%, 51%)', 'hsl(280, 60%, 50%)', 'hsl(45, 90%, 48%)'];

function downloadCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    '\uFEFF' + headers.join(','),
    ...data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

export default function AdminReports() {
  const { data: report, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReportData,
  });

  if (isLoading || !report) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const statusData = Object.entries(report.byStatus).map(([key, val]) => ({
    name: statusLabels[key as keyof typeof statusLabels] || key,
    value: val as number,
  }));

  const priorityData = Object.entries(report.byPriority).map(([key, val]) => ({
    name: priorityLabels[key as keyof typeof priorityLabels] || key,
    value: val as number,
  }));

  const deptData = Object.entries(report.byDepartment).map(([key, val]) => ({
    name: key,
    value: val as number,
  }));

  const systemData = Object.entries(report.bySystem || {}).map(([key, val]) => ({
    name: key,
    value: val as number,
  }));

  const serviceData = Object.entries(report.byService || {}).map(([key, val]) => ({
    name: key,
    value: val as number,
  }));

  const slaByServiceData = Object.entries(report.slaByService || {}).map(([key, val]: any) => ({
    name: key,
    compliance: val.compliance,
    breaches: val.breaches,
  }));

  const handleExportAll = () => {
    const rows = (report.rawTickets || []).map((t: any) => ({
      'رقم التذكرة': t.ticket_number,
      'العنوان': t.title,
      'الحالة': statusLabels[t.status as keyof typeof statusLabels] || t.status,
      'الأولوية': priorityLabels[t.priority as keyof typeof priorityLabels] || t.priority,
      'القسم': t.department || '',
      'النظام': t.system || '',
      'الخدمة': t.service || '',
      'تاريخ الإنشاء': t.created_at,
      'تاريخ الحل': t.resolved_at || '',
      'زمن الحل (ساعات)': t.resolutionHours ?? '',
      'زمن أول رد (ساعات)': t.firstResponseHours ?? '',
    }));
    downloadCSV(rows, `tickets-report-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handlePrint = () => window.print();

  const kpis = [
    { icon: BarChart3, value: report.total, label: 'إجمالي التذاكر', color: 'text-primary' },
    { icon: Clock, value: `${report.avgResolutionHours}h`, label: 'متوسط زمن الحل', color: 'text-accent' },
    { icon: Timer, value: `${report.avgFirstResponseHours ?? 0}h`, label: 'متوسط أول رد', color: 'text-info' },
    { icon: ShieldCheck, value: `${report.slaCompliancePercent}%`, label: 'الالتزام بالـ SLA', color: 'text-success' },
    { icon: AlertTriangle, value: report.slaBreaches, label: 'تجاوزات SLA', color: 'text-destructive' },
    { icon: AlertTriangle, value: report.overdueCount ?? 0, label: 'متأخرة حالياً', color: 'text-warning' },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 gap-3 shrink-0 no-print">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-bold">التقارير</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5" />
                طباعة
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportAll}>
                <Download className="h-3.5 w-3.5" />
                تصدير CSV
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto" id="report-content">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Print Header */}
              <div className="hidden print-only text-center mb-6">
                <h1 className="text-2xl font-bold">تقرير التذاكر</h1>
                <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('ar-SA')}</p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {kpis.map((kpi, i) => (
                  <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" animate="show">
                    <Card className="hover:shadow-card-hover transition-shadow duration-300">
                      <CardContent className="pt-4 text-center">
                        <kpi.icon className={`h-5 w-5 mx-auto mb-1.5 ${kpi.color}`} />
                        <p className="text-2xl font-bold">{kpi.value}</p>
                        <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Row 1: Status + Priority */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">التذاكر حسب الحالة</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={statusData}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(152, 55%, 38%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">التذاكر حسب الأولوية</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                            {priorityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Row 2: System + Service */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {systemData.length > 0 && (
                  <motion.div custom={8} variants={fadeUp} initial="hidden" animate="show">
                    <Card>
                      <CardHeader><CardTitle className="text-sm">التذاكر حسب النظام</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={systemData}>
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="hsl(160, 60%, 42%)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {serviceData.length > 0 && (
                  <motion.div custom={9} variants={fadeUp} initial="hidden" animate="show">
                    <Card>
                      <CardHeader><CardTitle className="text-sm">التذاكر حسب الخدمة</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={serviceData} layout="vertical">
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                            <Tooltip />
                            <Bar dataKey="value" fill="hsl(152, 55%, 42%)" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>

              {/* Row 3: Department + SLA */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div custom={10} variants={fadeUp} initial="hidden" animate="show">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">التذاكر حسب القسم</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={deptData}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>

                {slaByServiceData.length > 0 && (
                  <motion.div custom={11} variants={fadeUp} initial="hidden" animate="show">
                    <Card>
                      <CardHeader><CardTitle className="text-sm">التزام SLA حسب الخدمة (%)</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={slaByServiceData}>
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                            <Tooltip />
                            <Bar dataKey="compliance" name="نسبة الالتزام %" fill="hsl(152, 55%, 42%)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>

              {/* Printable Table */}
              <motion.div custom={12} variants={fadeUp} initial="hidden" animate="show">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">جدول التذاكر التفصيلي</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-right p-2 font-medium">الرقم</th>
                          <th className="text-right p-2 font-medium">العنوان</th>
                          <th className="text-right p-2 font-medium">الحالة</th>
                          <th className="text-right p-2 font-medium">الأولوية</th>
                          <th className="text-right p-2 font-medium">النظام</th>
                          <th className="text-right p-2 font-medium">الخدمة</th>
                          <th className="text-right p-2 font-medium">زمن الحل</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(report.rawTickets || []).slice(0, 50).map((t: any, i: number) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="p-2">{t.ticket_number}</td>
                            <td className="p-2 max-w-[200px] truncate">{t.title}</td>
                            <td className="p-2">{statusLabels[t.status as keyof typeof statusLabels] || t.status}</td>
                            <td className="p-2">{priorityLabels[t.priority as keyof typeof priorityLabels] || t.priority}</td>
                            <td className="p-2">{t.system || '-'}</td>
                            <td className="p-2">{t.service || '-'}</td>
                            <td className="p-2">{t.resolutionHours ? `${t.resolutionHours}h` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
