import { useQuery } from '@tanstack/react-query';
import { fetchReportData, statusLabels, priorityLabels } from '@/lib/api';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(213, 58%, 23%)', 'hsl(28, 80%, 52%)', 'hsl(142, 60%, 40%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(199, 89%, 48%)', 'hsl(280, 60%, 50%)'];

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-3 shrink-0">
            <SidebarTrigger />
            <h1 className="text-lg font-bold">التقارير</h1>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <BarChart3 className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{report.total}</p>
                    <p className="text-xs text-muted-foreground">إجمالي التذاكر</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-accent" />
                    <p className="text-2xl font-bold">{report.avgResolutionHours} ساعة</p>
                    <p className="text-xs text-muted-foreground">متوسط زمن الحل</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <ShieldCheck className="h-6 w-6 mx-auto mb-2 text-success" />
                    <p className="text-2xl font-bold">{report.slaCompliancePercent}%</p>
                    <p className="text-xs text-muted-foreground">الالتزام بالـ SLA</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-destructive" />
                    <p className="text-2xl font-bold">{report.slaBreaches}</p>
                    <p className="text-xs text-muted-foreground">تجاوزات SLA</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-sm">التذاكر حسب الحالة</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={statusData}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(213, 58%, 23%)" radius={[4, 4, 0, 0]} />
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

                <Card className="lg:col-span-2">
                  <CardHeader><CardTitle className="text-sm">التذاكر حسب القسم</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={deptData}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(28, 80%, 52%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
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
