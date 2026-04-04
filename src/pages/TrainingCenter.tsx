import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { motion } from 'framer-motion';
import {
  BookOpen, PlayCircle, CheckCircle, Clock, Star, Users, Shield,
  Settings, Zap, Plug, BarChart3, Award, GraduationCap,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  lessons: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  icon: any;
  progress: number;
}

const COURSES: Course[] = [
  { id: '1', title: 'أساسيات نظام التذاكر', description: 'تعلم كيفية إنشاء وإدارة التذاكر بكفاءة', category: 'basics', duration: '45 دقيقة', lessons: 8, level: 'beginner', icon: BookOpen, progress: 100 },
  { id: '2', title: 'إدارة فريق الدعم', description: 'أفضل الممارسات لتوزيع وإدارة التذاكر بين الفريق', category: 'management', duration: '60 دقيقة', lessons: 10, level: 'intermediate', icon: Users, progress: 75 },
  { id: '3', title: 'تكوين سياسات SLA', description: 'إعداد وتتبع اتفاقيات مستوى الخدمة', category: 'admin', duration: '30 دقيقة', lessons: 5, level: 'intermediate', icon: Shield, progress: 50 },
  { id: '4', title: 'تكامل كلاسيرا المتقدم', description: 'ربط النظام مع مديولات كلاسيرا وإدارة المزامنة', category: 'integrations', duration: '90 دقيقة', lessons: 12, level: 'advanced', icon: Plug, progress: 20 },
  { id: '5', title: 'سير العمل والأتمتة', description: 'أتمتة المهام المتكررة وتحسين الكفاءة', category: 'admin', duration: '50 دقيقة', lessons: 7, level: 'advanced', icon: Zap, progress: 0 },
  { id: '6', title: 'التقارير والتحليلات', description: 'استخدام لوحات المعلومات وإنشاء تقارير مخصصة', category: 'analytics', duration: '40 دقيقة', lessons: 6, level: 'intermediate', icon: BarChart3, progress: 0 },
  { id: '7', title: 'إعدادات النظام والأمان', description: 'تكوين الأمان والصلاحيات والإعدادات المتقدمة', category: 'admin', duration: '35 دقيقة', lessons: 6, level: 'advanced', icon: Settings, progress: 0 },
  { id: '8', title: 'إدارة Multi-Tenant', description: 'إنشاء وإدارة المستأجرين والهوية البصرية', category: 'admin', duration: '55 دقيقة', lessons: 8, level: 'advanced', icon: Star, progress: 0 },
];

const levelColors: Record<string, string> = {
  beginner: 'bg-success/10 text-success border-success/20',
  intermediate: 'bg-warning/10 text-warning border-warning/20',
  advanced: 'bg-destructive/10 text-destructive border-destructive/20',
};

const levelLabels: Record<string, string> = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  advanced: 'متقدم',
};

export default function TrainingCenter() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const completedCourses = COURSES.filter(c => c.progress === 100).length;
  const overallProgress = Math.round(COURSES.reduce((sum, c) => sum + c.progress, 0) / COURSES.length);

  const categories = [
    { key: 'all', label: 'الكل' },
    { key: 'basics', label: 'الأساسيات' },
    { key: 'management', label: 'الإدارة' },
    { key: 'admin', label: 'إعدادات النظام' },
    { key: 'integrations', label: 'التكاملات' },
    { key: 'analytics', label: 'التحليلات' },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <h1 className="text-lg font-bold text-foreground">مركز التدريب</h1>
                <p className="text-xs text-muted-foreground">دورات تدريبية شاملة لاستخدام النظام</p>
              </div>
            </div>
            <NotificationsPopover />
          </header>

          <div className="p-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'الدورات المتاحة', value: COURSES.length, icon: BookOpen, color: 'text-primary' },
                { label: 'المكتملة', value: completedCourses, icon: CheckCircle, color: 'text-success' },
                { label: 'التقدم الكلي', value: `${overallProgress}%`, icon: Award, color: 'text-warning' },
                { label: 'إجمالي الدروس', value: COURSES.reduce((s, c) => s + c.lessons, 0), icon: GraduationCap, color: 'text-info' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card>
                    <CardContent className="flex items-center gap-4 py-5">
                      <div className="p-2.5 rounded-xl bg-muted/50">
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Courses */}
            <Tabs defaultValue="all">
              <TabsList className="mb-4 flex-wrap">
                {categories.map(cat => (
                  <TabsTrigger key={cat.key} value={cat.key}>{cat.label}</TabsTrigger>
                ))}
              </TabsList>
              {categories.map(cat => (
                <TabsContent key={cat.key} value={cat.key}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {COURSES.filter(c => cat.key === 'all' || c.category === cat.key).map((course, i) => (
                      <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => setSelectedCourse(course)}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <course.icon className="h-6 w-6 text-primary" />
                              </div>
                              <Badge className={levelColors[course.level]}>{levelLabels[course.level]}</Badge>
                            </div>
                            <CardTitle className="text-base mt-3">{course.title}</CardTitle>
                            <CardDescription className="text-xs">{course.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.duration}</span>
                              <span className="flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5" /> {course.lessons} دروس</span>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">التقدم</span>
                                <span className="font-medium text-foreground">{course.progress}%</span>
                              </div>
                              <Progress value={course.progress} className="h-1.5" />
                            </div>
                            <Button variant={course.progress === 100 ? 'secondary' : course.progress > 0 ? 'default' : 'outline'} size="sm" className="w-full gap-2">
                              {course.progress === 100 ? <><CheckCircle className="h-4 w-4" /> مراجعة</> :
                               course.progress > 0 ? <><PlayCircle className="h-4 w-4" /> استئناف</> :
                               <><PlayCircle className="h-4 w-4" /> ابدأ الآن</>}
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
