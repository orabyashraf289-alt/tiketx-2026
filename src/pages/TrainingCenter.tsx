import { useState, useMemo } from 'react';
import { PageLayout, PageHeader } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CourseDetailView } from '@/components/training/CourseDetailView';
import { TrainingMusicPlayer } from '@/components/training/TrainingMusicPlayer';
import {
  BookOpen, PlayCircle, CheckCircle, Clock, Users, Shield,
  Settings, Zap, Plug, BarChart3, Award, GraduationCap, Search, Star,
  TrendingUp, Sparkles, Target, Trophy,
} from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';

const ICON_MAP: Record<string, any> = { BookOpen, Users, Shield, Plug, Zap, BarChart3, Settings, Star };

const levelConfig: Record<string, { color: string; label: string }> = {
  beginner: { color: 'bg-success/10 text-success border-success/20', label: 'مبتدئ' },
  intermediate: { color: 'bg-warning/10 text-warning border-warning/20', label: 'متوسط' },
  advanced: { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'متقدم' },
};

const categories = [
  { key: 'all', label: 'جميع الدورات', icon: Sparkles },
  { key: 'basics', label: 'الأساسيات', icon: BookOpen },
  { key: 'management', label: 'الإدارة', icon: Users },
  { key: 'admin', label: 'إعدادات النظام', icon: Settings },
  { key: 'integrations', label: 'التكاملات', icon: Plug },
  { key: 'analytics', label: 'التحليلات', icon: BarChart3 },
];

export default function TrainingCenter() {
  const { user } = useAuth();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const { data: courses = [] } = useQuery({
    queryKey: ['training-courses'],
    queryFn: async () => {
      const { data } = await supabase.from('training_courses').select('*').order('sort_order');
      return data || [];
    },
  });

  const { data: lessonCounts = {} } = useQuery({
    queryKey: ['training-lesson-counts'],
    queryFn: async () => {
      const { data } = await supabase.from('training_lessons').select('course_id');
      const counts: Record<string, number> = {};
      (data || []).forEach(l => { counts[l.course_id] = (counts[l.course_id] || 0) + 1; });
      return counts;
    },
  });

  const { data: allProgress = [] } = useQuery({
    queryKey: ['training-progress-all', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('training_progress').select('*').eq('user_id', user.id).eq('completed', true);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['training-certificates-all', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('training_certificates').select('*').eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

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

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      if (searchQuery && !c.title.includes(searchQuery) && !(c.description || '').includes(searchQuery)) return false;
      if (levelFilter !== 'all' && c.level !== levelFilter) return false;
      return true;
    });
  }, [courses, searchQuery, levelFilter]);

  const completedCourses = courses.filter(c => courseProgress[c.id] === 100).length;
  const overallProgress = courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + (courseProgress[c.id] || 0), 0) / courses.length) : 0;
  const totalLessons = Object.values(lessonCounts).reduce((a, b) => a + b, 0);
  const inProgressCourses = courses.filter(c => {
    const p = courseProgress[c.id] || 0;
    return p > 0 && p < 100;
  });

  if (selectedCourseId) {
    return (
      <PageLayout>
        <PageHeader title="مركز التدريب" icon={<GraduationCap className="h-5 w-5" />} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <CourseDetailView courseId={selectedCourseId} onBack={() => setSelectedCourseId(null)} />
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="مركز التدريب"
        icon={<GraduationCap className="h-5 w-5" />}
      />
      <main className="flex-1 p-4 md:p-6 overflow-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="الدورات المتاحة" value={courses.length} icon={BookOpen} delay={0} />
          <StatsCard title="الدورات المكتملة" value={completedCourses} icon={Trophy} variant="success" delay={0.05} />
          <StatsCard title="الشهادات المحصّلة" value={certificates.length} icon={Award} variant="warning" delay={0.1} />
          <StatsCard title="التقدم الكلي" value={`${overallProgress}%`} icon={Target} variant="primary" delay={0.15} />
        </div>

        {/* Continue Learning Section */}
        {inProgressCourses.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">أكمل ما بدأته</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {inProgressCourses.slice(0, 3).map(course => {
                const progress = courseProgress[course.id] || 0;
                const IconComp = ICON_MAP[course.icon] || BookOpen;
                return (
                  <Card
                    key={course.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-primary/10 bg-primary/[0.02]"
                    onClick={() => setSelectedCourseId(course.id)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="shrink-0 p-2.5 rounded-xl bg-primary/10">
                        <IconComp className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{course.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Progress value={progress} className="h-1.5 flex-1" />
                          <span className="text-xs font-medium text-primary shrink-0">{progress}%</span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="shrink-0 text-primary">
                        <PlayCircle className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col sm:flex-row gap-3 items-start sm:items-center"
        >
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن دورة تدريبية..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'beginner', 'intermediate', 'advanced'].map(lvl => (
              <Button
                key={lvl}
                variant={levelFilter === lvl ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLevelFilter(lvl)}
                className="text-xs h-8"
              >
                {lvl === 'all' ? 'جميع المستويات' : levelConfig[lvl].label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Courses Grid with Category Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {categories.map(cat => (
              <TabsTrigger key={cat.key} value={cat.key} className="gap-1.5 text-xs data-[state=active]:shadow-sm">
                <cat.icon className="h-3.5 w-3.5" />
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(cat => (
            <TabsContent key={cat.key} value={cat.key}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCourses
                  .filter(c => cat.key === 'all' || c.category === cat.key)
                  .map((course, i) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      progress={courseProgress[course.id] || 0}
                      hasCert={certSet.has(course.id)}
                      lessonsCount={lessonCounts[course.id] || 0}
                      index={i}
                      onClick={() => setSelectedCourseId(course.id)}
                    />
                  ))}
                {filteredCourses.filter(c => cat.key === 'all' || c.category === cat.key).length === 0 && (
                  <div className="col-span-full py-16 text-center">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">لا توجد دورات مطابقة</p>
                    <p className="text-xs text-muted-foreground mt-1">جرّب تغيير معايير البحث أو الفلترة</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </PageLayout>
  );
}

// --- Extracted CourseCard Component ---
interface CourseCardProps {
  course: any;
  progress: number;
  hasCert: boolean;
  lessonsCount: number;
  index: number;
  onClick: () => void;
}

function CourseCard({ course, progress, hasCert, lessonsCount, index, onClick }: CourseCardProps) {
  const IconComp = ICON_MAP[course.icon] || BookOpen;
  const level = levelConfig[course.level] || levelConfig.beginner;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card
        className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20"
        onClick={onClick}
      >
        {/* Video Preview */}
        {course.intro_video_url && (
          <div className="relative w-full aspect-video bg-muted overflow-hidden">
            <video
              src={course.intro_video_url}
              muted
              loop
              playsInline
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onMouseOver={e => (e.target as HTMLVideoElement).play()}
              onMouseOut={e => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
            <div className="absolute top-3 left-3">
              <Badge className={`${level.color} text-[10px] font-medium`}>{level.label}</Badge>
            </div>
            {hasCert && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-primary/90 text-primary-foreground text-[10px] gap-1 shadow-sm">
                  <Award className="h-3 w-3" /> شهادة
                </Badge>
              </div>
            )}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 text-[11px] text-white/90">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration_minutes} د</span>
              <span className="w-px h-3 bg-white/30" />
              <span className="flex items-center gap-1"><PlayCircle className="h-3 w-3" /> {lessonsCount} دروس</span>
            </div>
          </div>
        )}

        {/* Card Body */}
        <CardContent className="p-4 space-y-3">
          {!course.intro_video_url && (
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                <IconComp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex gap-1.5">
                {hasCert && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1">
                    <Award className="h-3 w-3" /> شهادة
                  </Badge>
                )}
                <Badge className={`${level.color} text-[10px]`}>{level.label}</Badge>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold text-foreground leading-relaxed group-hover:text-primary transition-colors">
              {course.title}
            </h3>
            {course.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{course.description}</p>
            )}
          </div>

          {!course.intro_video_url && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration_minutes} دقيقة</span>
              <span className="flex items-center gap-1"><PlayCircle className="h-3 w-3" /> {lessonsCount} دروس</span>
            </div>
          )}

          {/* Progress */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">التقدم</span>
              <span className="font-semibold text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Action Button */}
          <Button
            variant={progress === 100 ? 'secondary' : progress > 0 ? 'default' : 'outline'}
            size="sm"
            className="w-full gap-2 text-xs h-9"
          >
            {progress === 100 ? <><CheckCircle className="h-3.5 w-3.5" /> مراجعة الدورة</> :
             progress > 0 ? <><PlayCircle className="h-3.5 w-3.5" /> استئناف التعلّم</> :
             <><PlayCircle className="h-3.5 w-3.5" /> ابدأ التعلّم</>}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
