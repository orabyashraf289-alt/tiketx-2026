import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { motion } from 'framer-motion';
import {
  Rocket, CheckCircle, Circle, Clock, Building2, Users, AlertTriangle,
  ArrowRight, Shield, Plug, Zap, GraduationCap, BarChart3,
} from 'lucide-react';

interface RolloutPhase {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  progress: number;
  startWeek: string;
  endWeek: string;
  milestones: { label: string; done: boolean }[];
  icon: any;
}

export default function RolloutManagement() {
  const { data: tenants = [] } = useQuery({
    queryKey: ['rollout-tenants'],
    queryFn: async () => {
      const { data } = await supabase.from('tenants').select('*').eq('is_active', true);
      return data || [];
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['rollout-users'],
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: ticketCount = 0 } = useQuery({
    queryKey: ['rollout-tickets'],
    queryFn: async () => {
      const { count } = await supabase.from('tickets').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ['rollout-integrations'],
    queryFn: async () => {
      const { data } = await supabase.from('integration_configs').select('*').eq('is_active', true);
      return data || [];
    },
  });

  const phases: RolloutPhase[] = [
    {
      id: 'foundation',
      name: 'المرحلة 1: التأسيس',
      description: 'إعداد البنية التحتية والمستأجرين والهوية البصرية',
      status: tenants.length >= 3 ? 'completed' : 'in_progress',
      progress: tenants.length >= 3 ? 100 : Math.min(90, tenants.length * 30),
      startWeek: 'الأسبوع 1',
      endWeek: 'الأسبوع 4',
      icon: Building2,
      milestones: [
        { label: 'إنشاء المستأجرين الرئيسيين', done: tenants.length >= 3 },
        { label: 'تكوين White-Label لكل مؤسسة', done: tenants.some(t => t.primary_color !== '#6366f1') },
        { label: 'إعداد الأدوار والصلاحيات', done: true },
        { label: 'تكوين سياسات SLA', done: true },
      ],
    },
    {
      id: 'integration',
      name: 'المرحلة 2: التكامل التقني',
      description: 'ربط مديولات كلاسيرا وتفعيل المزامنة الثنائية',
      status: integrations.length >= 3 ? 'completed' : integrations.length > 0 ? 'in_progress' : 'upcoming',
      progress: integrations.length >= 3 ? 100 : integrations.length * 25,
      startWeek: 'الأسبوع 5',
      endWeek: 'الأسبوع 8',
      icon: Plug,
      milestones: [
        { label: 'تفعيل Webhook كلاسيرا', done: integrations.length > 0 },
        { label: 'اختبار استقبال التذاكر', done: integrations.some(i => i.tickets_received > 0) },
        { label: 'تفعيل المزامنة الثنائية', done: integrations.some(i => i.sync_direction === 'bidirectional') },
        { label: 'اختبار جميع المديولات', done: integrations.length >= 5 },
      ],
    },
    {
      id: 'pilot',
      name: 'المرحلة 3: الإطلاق التجريبي',
      description: 'تشغيل تجريبي مع مجموعة محدودة من المستخدمين',
      status: ticketCount > 10 ? 'completed' : ticketCount > 0 ? 'in_progress' : 'upcoming',
      progress: ticketCount > 10 ? 100 : Math.min(90, ticketCount * 10),
      startWeek: 'الأسبوع 9',
      endWeek: 'الأسبوع 12',
      icon: Rocket,
      milestones: [
        { label: 'اختيار مجموعة تجريبية (50 مستخدم)', done: ticketCount > 0 },
        { label: 'تشغيل اختبارات النظام', done: ticketCount > 5 },
        { label: 'جمع ملاحظات المستخدمين', done: ticketCount > 10 },
        { label: 'معالجة المشاكل المكتشفة', done: ticketCount > 10 },
      ],
    },
    {
      id: 'training',
      name: 'المرحلة 4: التدريب والتأهيل',
      description: 'تدريب جميع الفرق والمستخدمين على النظام',
      status: 'upcoming',
      progress: 15,
      startWeek: 'الأسبوع 13',
      endWeek: 'الأسبوع 16',
      icon: GraduationCap,
      milestones: [
        { label: 'إعداد المحتوى التدريبي', done: true },
        { label: 'تدريب فريق الدعم الفني', done: false },
        { label: 'تدريب المطورين', done: false },
        { label: 'تدريب المسؤولين في كل مؤسسة', done: false },
      ],
    },
    {
      id: 'rollout',
      name: 'المرحلة 5: الإطلاق الشامل',
      description: 'توسيع النظام لجميع المؤسسات والمستخدمين',
      status: 'upcoming',
      progress: 0,
      startWeek: 'الأسبوع 17',
      endWeek: 'الأسبوع 22',
      icon: Users,
      milestones: [
        { label: 'إطلاق وزارة التعليم', done: false },
        { label: 'إطلاق الجامعات والمؤسسات', done: false },
        { label: 'تفعيل جميع القنوات (WhatsApp/Email)', done: false },
        { label: 'مراقبة الأداء المستمرة', done: false },
      ],
    },
    {
      id: 'optimization',
      name: 'المرحلة 6: التحسين المستمر',
      description: 'تحسين الأداء وإضافة ميزات متقدمة',
      status: 'upcoming',
      progress: 0,
      startWeek: 'الأسبوع 23',
      endWeek: 'الأسبوع 26',
      icon: BarChart3,
      milestones: [
        { label: 'تحليل بيانات الأداء', done: false },
        { label: 'تحسين نماذج AI', done: false },
        { label: 'إضافة تقارير تنبؤية', done: false },
        { label: 'توثيق الدروس المستفادة', done: false },
      ],
    },
  ];

  const overallProgress = Math.round(phases.reduce((s, p) => s + p.progress, 0) / phases.length);
  const completedPhases = phases.filter(p => p.status === 'completed').length;

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    completed: { label: 'مكتمل', color: 'text-success', bg: 'bg-success/10 border-success/20' },
    in_progress: { label: 'قيد التنفيذ', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    upcoming: { label: 'قادم', color: 'text-muted-foreground', bg: 'bg-muted/30 border-border/50' },
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <h1 className="text-lg font-bold text-foreground">إدارة خطة الإطلاق</h1>
                <p className="text-xs text-muted-foreground">تتبع تقدم المراحل الست للتفعيل الشامل</p>
              </div>
            </div>
            <NotificationsPopover />
          </header>

          <div className="p-6 space-y-6">
            {/* Overall Progress */}
            <Card className="border-2 border-primary/20">
              <CardContent className="py-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">التقدم الكلي للمشروع</h2>
                    <p className="text-sm text-muted-foreground">{completedPhases} من {phases.length} مراحل مكتملة</p>
                  </div>
                  <div className="text-left">
                    <p className="text-3xl font-bold text-primary">{overallProgress}%</p>
                    <p className="text-xs text-muted-foreground">الأسبوع 1 — 26</p>
                  </div>
                </div>
                <Progress value={overallProgress} className="h-3" />
                <div className="flex justify-between mt-2">
                  {phases.map(p => (
                    <div key={p.id} className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${p.status === 'completed' ? 'bg-success' : p.status === 'in_progress' ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'}`} />
                      <span className="text-[9px] text-muted-foreground mt-1 hidden md:block">{p.id === 'foundation' ? 'تأسيس' : p.id === 'integration' ? 'تكامل' : p.id === 'pilot' ? 'تجريبي' : p.id === 'training' ? 'تدريب' : p.id === 'rollout' ? 'إطلاق' : 'تحسين'}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'المستأجرون النشطون', value: tenants.length, icon: Building2, color: 'text-primary' },
                { label: 'المستخدمون', value: users, icon: Users, color: 'text-info' },
                { label: 'التذاكر المعالجة', value: ticketCount, icon: Zap, color: 'text-success' },
                { label: 'التكاملات النشطة', value: integrations.length, icon: Plug, color: 'text-warning' },
              ].map((kpi, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card>
                    <CardContent className="flex items-center gap-4 py-5">
                      <div className="p-2.5 rounded-xl bg-muted/50"><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                        <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Phase Cards */}
            <div className="space-y-4">
              {phases.map((phase, i) => {
                const config = statusConfig[phase.status];
                return (
                  <motion.div key={phase.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card className={`border ${config.bg}`}>
                      <CardContent className="py-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-2xl shrink-0 ${phase.status === 'completed' ? 'bg-success/10' : phase.status === 'in_progress' ? 'bg-primary/10' : 'bg-muted/50'}`}>
                            <phase.icon className={`h-6 w-6 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                              <h3 className="text-base font-bold text-foreground">{phase.name}</h3>
                              <Badge className={`${config.bg} ${config.color} text-xs`}>{config.label}</Badge>
                              <span className="text-xs text-muted-foreground">{phase.startWeek} — {phase.endWeek}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{phase.description}</p>
                            
                            <div className="mb-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-muted-foreground">التقدم</span>
                                <span className="font-medium text-foreground">{phase.progress}%</span>
                              </div>
                              <Progress value={phase.progress} className="h-1.5" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {phase.milestones.map((ms, j) => (
                                <div key={j} className="flex items-center gap-2 text-sm">
                                  {ms.done ? (
                                    <CheckCircle className="h-4 w-4 text-success shrink-0" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                                  )}
                                  <span className={ms.done ? 'text-foreground' : 'text-muted-foreground'}>{ms.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
