import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchReportData, statusLabels, priorityLabels } from '@/lib/api';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart3, Clock, ShieldCheck, AlertTriangle, Download, Timer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['hsl(252, 56%, 52%)', 'hsl(216, 72%, 52%)', 'hsl(152, 55%, 42%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(199, 89%, 48%)', 'hsl(280, 60%, 50%)'];

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-bold">التقارير</h1>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportAll}>
              <Download className="h-3.5 w-3.5" />
              تصدير CSV
            </Button>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <BarChart3 className="h-5 w-5 mx-auto mb-1.5 text-primary" />
                    <p className="text-2xl font-bold">{report.total}</p>
                    <p className="text-xs text-muted-foreground">إجمالي التذاكر</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Clock className="h-5 w-5 mx-auto mb-1.5 text-accent" />
                    <p className="text-2xl font-bold">{report.avgResolutionHours}h</p>
                    <p className="text-xs text-muted-foreground">متوسط زمن الحل</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Timer className="h-5 w-5 mx-auto mb-1.5 text-info" />
                    <p className="text-2xl font-bold">{report.avgFirstResponseHours ?? 0}h</p>
                    <p className="text-xs text-muted-foreground">متوسط أول رد</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <ShieldCheck className="h-5 w-5 mx-auto mb-1.5 text-success" />
                    <p className="text-2xl font-bold">{report.slaCompliancePercent}%</p>
                    <p className="text-xs text-muted-foreground">الالتزام بالـ SLA</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <AlertTriangle className="h-5 w-5 mx-auto mb-1.5 text-destructive" />
                    <p className="text-2xl font-bold">{report.slaBreaches}</p>
                    <p className="text-xs text-muted-foreground">تجاوزات SLA</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <AlertTriangle className="h-5 w-5 mx-auto mb-1.5 text-warning" />
                    <p className="text-2xl font-bold">{report.overdueCount ?? 0}</p>
                    <p className="text-xs text-muted-foreground">متأخرة حالياً</p>
                  </CardContent>
                </Card>
              </div>

              {/* Row 1: Status + Priority */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-sm">التذاكر حسب الحالة</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={statusData}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(252, 56%, 52%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

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
              </div>

              {/* Row 2: System + Service */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {systemData.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">التذاكر حسب النظام</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={systemData}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(216, 72%, 52%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {serviceData.length > 0 && (
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
                )}
              </div>

              {/* Row 3: Department + SLA by Service */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                {slaByServiceData.length > 0 && (
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
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
