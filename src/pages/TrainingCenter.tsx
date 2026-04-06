import { useState, useMemo } from 'react';
import { PageLayout, PageHeader } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CourseDetailView } from '@/components/training/CourseDetailView';
import { TrainingMusicPlayer } from '@/components/training/TrainingMusicPlayer';
import {
  BookOpen, PlayCircle, CheckCircle, Clock, Users, Shield,
  Settings, Zap, Plug, BarChart3, Award, GraduationCap, Search, Star,
  Trophy, Play, Film, Layers, TrendingUp,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = { BookOpen, Users, Shield, Plug, Zap, BarChart3, Settings, Star };

const COURSE_VIDEOS: Record<number, string> = {
  0: '/__l5e/assets-v1/43561df2-b838-47e6-95fb-49cfcb1f8d51/course-tickets.mp4',
  1: '/__l5e/assets-v1/c7cdb287-7e53-4f72-a0e8-093e9b73710d/course-team.mp4',
  2: '/__l5e/assets-v1/c6070eab-e0f9-4d44-9aa8-02a5a5cb2b98/course-sla.mp4',
  3: '/__l5e/assets-v1/16476644-7c9a-48a9-9b23-257fba76c26b/course-integration.mp4',
  4: '/__l5e/assets-v1/6001e3bb-5c8f-40c9-aff4-7cbcc95180b5/course-automation.mp4',
  5: '/__l5e/assets-v1/fa4f9bbb-6899-4f14-98e5-edb7dc7ab2fe/course-reports.mp4',
  6: '/__l5e/assets-v1/605cbf81-ef44-432e-ab02-bff7d6da4254/course-security.mp4',
  7: '/__l5e/assets-v1/a49b008b-28e5-4897-ad1e-f70095ca1d17/course-tenant.mp4',
};

const HERO_VIDEO = '/__l5e/assets-v1/886408c0-eb33-4d7f-9c30-df3b769b3b59/hero-training.mp4';

const MOTION_VIDEOS: Record<number, string> = {
  0: '/course-1-guide.mp4', 1: '/course-2-guide.mp4', 2: '/course-3-guide.mp4', 3: '/course-4-guide.mp4',
  4: '/course-5-guide.mp4', 5: '/course-6-guide.mp4', 6: '/course-7-guide.mp4', 7: '/course-8-guide.mp4',
};

const levelConfig: Record<string, { color: string; label: string; dot: string }> = {
  beginner: { color: 'bg-success/10 text-success border-success/20', label: 'مبتدئ', dot: 'bg-success' },
  intermediate: { color: 'bg-warning/10 text-warning border-warning/20', label: 'متوسط', dot: 'bg-warning' },
  advanced: { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'متقدم', dot: 'bg-destructive' },
};

const categories = [
  { key: 'all', label: 'جميع الدورات', icon: Layers },
  { key: 'basics', label: 'الأساسيات', icon: BookOpen },
  { key: 'management', label: 'الإدارة', icon: Users },
  { key: 'admin', label: 'النظام', icon: Settings },
  { key: 'integrations', label: 'التكاملات', icon: Plug },
  { key: 'analytics', label: 'التحليلات', icon: BarChart3 },
];

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, value, label, accent }: { icon: any; value: number | string; label: string; accent?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 shadow-sm`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent || 'bg-primary/10'}`}>
        <Icon className={`h-5 w-5 ${accent ? 'text-primary-foreground' : 'text-primary'}`} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-extrabold text-foreground leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

/* ─── Course Card ─── */
function CourseCard({
  course, progress, hasCert, lessonsCount, index, onSelect, onMotionVideo,
}: {
  course: any; progress: number; hasCert: boolean; lessonsCount: number;
  index: number; onSelect: () => void; onMotionVideo: (url: string, title: string) => void;
}) {
  const IconComp = ICON_MAP[course.icon] || BookOpen;
  const level = levelConfig[course.level] || levelConfig.beginner;
  const aiVideo = COURSE_VIDEOS[course.sort_order - 1];
  const motionVideo = MOTION_VIDEOS[course.sort_order - 1];
  const isComplete = progress === 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <div
        className="relative cursor-pointer rounded-2xl border border-border/40 bg-card overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-500"
        onClick={onSelect}
      >
        {/* Video Area */}
        <div className="relative aspect-[16/9] bg-muted overflow-hidden">
          {aiVideo && (
            <video
              src={aiVideo}
              muted loop playsInline
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              onMouseOver={e => (e.target as HTMLVideoElement).play()}
              onMouseOut={e => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
            />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Play icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="h-14 w-14 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-xl shadow-primary/25 scale-90 group-hover:scale-100 transition-transform duration-300">
              <Play className="h-6 w-6 text-primary-foreground ml-0.5" />
            </div>
          </div>

          {/* Top badges */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <Badge className={`${level.color} text-[10px] font-semibold border px-2 py-0.5`}>
              {level.label}
            </Badge>
            {hasCert && (
              <Badge className="bg-primary text-primary-foreground text-[10px] gap-1 px-2 py-0.5">
                <Award className="h-3 w-3" /> معتمد
              </Badge>
            )}
          </div>

          {/* Course number */}
          <div className="absolute top-3 left-3">
            <span className="text-[10px] font-bold text-white/60 bg-white/10 backdrop-blur-sm rounded-md px-2 py-1">
              {String(course.sort_order).padStart(2, '0')}
            </span>
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-0 inset-x-0 px-4 py-3 flex items-end justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white leading-snug line-clamp-1 mb-1">
                {course.title}
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-white/70">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration_minutes} دقيقة</span>
                <span className="flex items-center gap-1"><PlayCircle className="h-3 w-3" />{lessonsCount} درس</span>
              </div>
            </div>
            {motionVideo && (
              <button
                onClick={e => { e.stopPropagation(); onMotionVideo(motionVideo, course.title); }}
                className="flex items-center gap-1 text-[9px] text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full px-2.5 py-1 transition-all shrink-0 mr-2"
              >
                <Film className="h-3 w-3" /> موشن
              </button>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 group-hover:bg-primary/12 transition-colors">
              <IconComp className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              {course.description && (
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{course.description}</p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground font-medium">التقدم في الدورة</span>
              <span className={`font-bold ${isComplete ? 'text-success' : 'text-foreground'}`}>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Action button */}
          <Button
            variant={isComplete ? 'secondary' : progress > 0 ? 'default' : 'outline'}
            size="sm"
            className="w-full text-xs h-9 gap-2 font-semibold"
          >
            {isComplete ? <><CheckCircle className="h-3.5 w-3.5" /> مراجعة الدورة</> :
             progress > 0 ? <><PlayCircle className="h-3.5 w-3.5" /> متابعة التعلّم</> :
             <><PlayCircle className="h-3.5 w-3.5" /> ابدأ الدورة</>}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */
export default function TrainingCenter() {
  const { user } = useAuth();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [videoDialog, setVideoDialog] = useState<{ url: string; title: string } | null>(null);

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
    allProgress.forEach(p => { completedPerCourse[p.course_id] = (completedPerCourse[p.course_id] || 0) + 1; });
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
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      return true;
    });
  }, [courses, searchQuery, levelFilter, categoryFilter]);

  const completedCourses = courses.filter(c => courseProgress[c.id] === 100).length;
  const overallProgress = courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + (courseProgress[c.id] || 0), 0) / courses.length) : 0;

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
        title="الدليل الاحترافي الشامل"
        icon={<GraduationCap className="h-5 w-5" />}
        actions={<TrainingMusicPlayer />}
      />
      <main className="flex-1 overflow-auto">
        {/* ── Hero Section ── */}
        <div className="relative w-full h-[260px] md:h-[300px] overflow-hidden">
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" src={HERO_VIDEO} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background/60" />

          <div className="relative h-full flex flex-col justify-end p-6 md:px-8 md:pb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-1 rounded-full bg-primary" />
                <h1 className="text-xl md:text-2xl font-extrabold text-foreground">
                  تعلّم النظام خطوة بخطوة
                </h1>
              </div>
              <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
                دورات تدريبية احترافية بالذكاء الاصطناعي وموشن جرافيك لإتقان جميع مزايا النظام
              </p>
            </motion.div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="px-4 md:px-8 -mt-5 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={BookOpen} value={courses.length} label="دورة تدريبية" />
            <StatCard icon={Trophy} value={completedCourses} label="دورة مكتملة" />
            <StatCard icon={Award} value={certificates.length} label="شهادة إتمام" />
            <StatCard icon={TrendingUp} value={`${overallProgress}%`} label="نسبة الإنجاز" />
          </div>
        </div>

        <div className="p-4 md:px-8 md:py-6 space-y-5">
          {/* ── Search & Filters ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col lg:flex-row gap-3 items-start lg:items-center"
          >
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="ابحث عن دورة..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pr-10 h-9 text-xs bg-muted/40 border-border/50"
              />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/30">
              {categories.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setCategoryFilter(cat.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    categoryFilter === cat.key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <cat.icon className="h-3 w-3" />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Level filters */}
            <div className="flex items-center gap-1.5 mr-auto lg:mr-0">
              {['all', 'beginner', 'intermediate', 'advanced'].map(lvl => {
                const cfg = levelConfig[lvl];
                return (
                  <button
                    key={lvl}
                    onClick={() => setLevelFilter(lvl)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                      levelFilter === lvl
                        ? 'border-primary/30 bg-primary/5 text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cfg && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />}
                    {lvl === 'all' ? 'الكل' : cfg?.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* ── Courses Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredCourses.map((course, i) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  progress={courseProgress[course.id] || 0}
                  hasCert={certSet.has(course.id)}
                  lessonsCount={lessonCounts[course.id] || 0}
                  index={i}
                  onSelect={() => setSelectedCourseId(course.id)}
                  onMotionVideo={(url, title) => setVideoDialog({ url, title: title + ' - موشن جرافيك' })}
                />
              ))}
            </AnimatePresence>

            {filteredCourses.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                  <Search className="h-6 w-6 text-muted-foreground/60" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">لا توجد دورات مطابقة</p>
                <p className="text-xs text-muted-foreground/70 mt-1">جرّب تغيير معايير البحث</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Video Dialog ── */}
      <Dialog open={!!videoDialog} onOpenChange={() => setVideoDialog(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden gap-0 rounded-2xl">
          <div className="px-5 pt-4 pb-2 flex items-center gap-2">
            <Film className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">{videoDialog?.title}</h3>
          </div>
          <div className="w-full bg-black">
            {videoDialog && (
              <video controls autoPlay className="w-full max-h-[70vh]" src={videoDialog.url}>
                متصفحك لا يدعم تشغيل الفيديو
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
