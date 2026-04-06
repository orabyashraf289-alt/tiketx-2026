import { useState, useMemo } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CourseDetailView } from '@/components/training/CourseDetailView';
import {
  BookOpen, PlayCircle, CheckCircle, Clock, Users, Shield,
  Settings, Zap, Plug, BarChart3, Award, GraduationCap, Search, Star,
  TrendingUp,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = { BookOpen, Users, Shield, Plug, Zap, BarChart3, Settings, Star };

const levelColors: Record<string, string> = {
  beginner: 'bg-success/10 text-success border-success/20',
  intermediate: 'bg-warning/10 text-warning border-warning/20',
  advanced: 'bg-destructive/10 text-destructive border-destructive/20',
};
const levelLabels: Record<string, string> = { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' };

const categories = [
  { key: 'all', label: 'الكل' },
  { key: 'basics', label: 'الأساسيات' },
  { key: 'management', label: 'الإدارة' },
  { key: 'admin', label: 'إعدادات النظام' },
  { key: 'integrations', label: 'التكاملات' },
  { key: 'analytics', label: 'التحليلات' },
];

export default function TrainingCenter() {
  const { user } = useAuth();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Fetch courses
  const { data: courses = [] } = useQuery({
    queryKey: ['training-courses'],
    queryFn: async () => {
      const { data } = await supabase.from('training_courses').select('*').order('sort_order');
      return data || [];
    },
  });

  // Fetch all lessons count per course
  const { data: lessonCounts = {} } = useQuery({
    queryKey: ['training-lesson-counts'],
    queryFn: async () => {
      const { data } = await supabase.from('training_lessons').select('course_id');
      const counts: Record<string, number> = {};
      (data || []).forEach(l => { counts[l.course_id] = (counts[l.course_id] || 0) + 1; });
      return counts;
    },
  });

  // Fetch user progress
  const { data: allProgress = [] } = useQuery({
    queryKey: ['training-progress-all', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('training_progress').select('*').eq('user_id', user.id).eq('completed', true);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch certificates
  const { data: certificates = [] } = useQuery({
    queryKey: ['training-certificates-all', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('training_certificates').select('*').eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Compute progress per course
  const courseProgress = useMemo(() => {
    const map: Record<string, number> = {};
    const completedPerCourse: Record<string, number> = {};
    allProgress.forEach(p => {
      completedPerCourse[p.course_id] = (completedPerCourse[p.course_id] || 0) + 1;
    });
    courses.forEach(c => {
      const total = lessonCounts[c.id] || 1;
      const completed = completedPerCourse[c.id] || 0;
      map[c.id] = Math.round((completed / total) * 100);
    });
    return map;
  }, [courses, allProgress, lessonCounts]);

  const certSet = useMemo(() => new Set(certificates.map(c => c.course_id)), [certificates]);

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      if (searchQuery && !c.title.includes(searchQuery) && !(c.description || '').includes(searchQuery)) return false;
      if (levelFilter !== 'all' && c.level !== levelFilter) return false;
      return true;
    });
  }, [courses, searchQuery, levelFilter]);

  // KPI stats
  const completedCourses = courses.filter(c => courseProgress[c.id] === 100).length;
  const overallProgress = courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + (courseProgress[c.id] || 0), 0) / courses.length) : 0;
  const totalLessons = Object.values(lessonCounts).reduce((a, b) => a + b, 0);

  if (selectedCourseId) {
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
                </div>
              </div>
              <NotificationsPopover />
            </header>
            <CourseDetailView courseId={selectedCourseId} onBack={() => setSelectedCourseId(null)} />
          </main>
        </div>
      </SidebarProvider>
    );
  }

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
            {/* KPI Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'الدورات المتاحة', value: courses.length, icon: BookOpen, color: 'text-primary' },
                { label: 'المكتملة', value: completedCourses, icon: CheckCircle, color: 'text-success' },
                { label: 'الشهادات', value: certificates.length, icon: Award, color: 'text-warning' },
                { label: 'التقدم الكلي', value: `${overallProgress}%`, icon: TrendingUp, color: 'text-info' },
                { label: 'إجمالي الدروس', value: totalLessons, icon: GraduationCap, color: 'text-primary' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card>
                    <CardContent className="flex items-center gap-4 py-4">
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

            {/* Search & Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في الدورات..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'beginner', 'intermediate', 'advanced'].map(lvl => (
                  <Button
                    key={lvl}
                    variant={levelFilter === lvl ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLevelFilter(lvl)}
                  >
                    {lvl === 'all' ? 'الكل' : levelLabels[lvl]}
                  </Button>
                ))}
              </div>
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
                    {filteredCourses.filter(c => cat.key === 'all' || c.category === cat.key).map((course, i) => {
                      const progress = courseProgress[course.id] || 0;
                      const hasCert = certSet.has(course.id);
                      const IconComp = ICON_MAP[course.icon] || BookOpen;
                      const lessonsCount = lessonCounts[course.id] || 0;

                      return (
                        <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <Card className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => setSelectedCourseId(course.id)}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                  <IconComp className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex gap-2">
                                  {hasCert && (
                                    <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                                      <Award className="h-3 w-3" /> شهادة
                                    </Badge>
                                  )}
                                  <Badge className={levelColors[course.level]}>{levelLabels[course.level]}</Badge>
                                </div>
                              </div>
                              <CardTitle className="text-base mt-3">{course.title}</CardTitle>
                              <CardDescription className="text-xs">{course.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.duration_minutes} دقيقة</span>
                                <span className="flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5" /> {lessonsCount} دروس</span>
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">التقدم</span>
                                  <span className="font-medium text-foreground">{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-1.5" />
                              </div>
                              <Button
                                variant={progress === 100 ? 'secondary' : progress > 0 ? 'default' : 'outline'}
                                size="sm"
                                className="w-full gap-2"
                              >
                                {progress === 100 ? <><CheckCircle className="h-4 w-4" /> مراجعة</> :
                                 progress > 0 ? <><PlayCircle className="h-4 w-4" /> استئناف</> :
                                 <><PlayCircle className="h-4 w-4" /> ابدأ الآن</>}
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                    {filteredCourses.filter(c => cat.key === 'all' || c.category === cat.key).length === 0 && (
                      <div className="col-span-full py-12 text-center text-muted-foreground">
                        لا توجد دورات مطابقة
                      </div>
                    )}
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
