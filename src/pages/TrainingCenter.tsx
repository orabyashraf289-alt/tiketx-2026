import { useState, useMemo, useRef } from 'react';
import { PageLayout, PageHeader } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
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
  TrendingUp, Sparkles, Target, Trophy, Play, Pause, Volume2, VolumeX,
  ChevronLeft, ChevronRight, Film, Video,
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
  0: '/course-1-guide.mp4',
  1: '/course-2-guide.mp4',
  2: '/course-3-guide.mp4',
  3: '/course-4-guide.mp4',
  4: '/course-5-guide.mp4',
  5: '/course-6-guide.mp4',
  6: '/course-7-guide.mp4',
  7: '/course-8-guide.mp4',
};

const levelConfig: Record<string, { color: string; label: string }> = {
  beginner: { color: 'bg-success/10 text-success border-success/20', label: 'مبتدئ' },
  intermediate: { color: 'bg-warning/10 text-warning border-warning/20', label: 'متوسط' },
  advanced: { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'متقدم' },
};

const categories = [
  { key: 'all', label: 'الكل', icon: Sparkles },
  { key: 'basics', label: 'الأساسيات', icon: BookOpen },
  { key: 'management', label: 'الإدارة', icon: Users },
  { key: 'admin', label: 'النظام', icon: Settings },
  { key: 'integrations', label: 'التكاملات', icon: Plug },
  { key: 'analytics', label: 'التحليلات', icon: BarChart3 },
];

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
        title="مركز التدريب"
        icon={<GraduationCap className="h-5 w-5" />}
        actions={<TrainingMusicPlayer />}
      />
      <main className="flex-1 overflow-auto">
        {/* Hero Section */}
        <div className="relative w-full h-[320px] md:h-[380px] overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src={HERO_VIDEO}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
          <div className="relative h-full flex flex-col justify-end p-6 md:p-8 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge className="bg-primary/20 text-primary border-primary/30 mb-3 text-[11px] gap-1.5">
                <Film className="h-3 w-3" /> دليل شامل بالذكاء الاصطناعي
              </Badge>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight mb-2">
                الدليل الاحترافي الشامل
              </h1>
              <p className="text-sm text-muted-foreground max-w-lg leading-relaxed mb-4">
                تعلّم جميع مزايا النظام خطوة بخطوة مع فيديوهات موشن جرافيك وذكاء اصطناعي احترافية
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> {courses.length} دورات</span>
                  <span className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5 text-warning" /> {completedCourses} مكتملة</span>
                  <span className="flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-primary" /> {certificates.length} شهادات</span>
                  <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> {overallProgress}% إنجاز</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col md:flex-row gap-3 items-start md:items-center"
          >
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن دورة..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pr-10 bg-muted/50"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {categories.map(cat => (
                <Button
                  key={cat.key}
                  variant={categoryFilter === cat.key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCategoryFilter(cat.key)}
                  className="text-xs h-8 gap-1.5"
                >
                  <cat.icon className="h-3 w-3" />
                  {cat.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-1 mr-auto md:mr-0">
              {['all', 'beginner', 'intermediate', 'advanced'].map(lvl => (
                <Button
                  key={lvl}
                  variant={levelFilter === lvl ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setLevelFilter(lvl)}
                  className="text-[10px] h-7 px-2.5"
                >
                  {lvl === 'all' ? 'الكل' : levelConfig[lvl].label}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredCourses.map((course, i) => {
                const progress = courseProgress[course.id] || 0;
                const hasCert = certSet.has(course.id);
                const lessonsCount = lessonCounts[course.id] || 0;
                const IconComp = ICON_MAP[course.icon] || BookOpen;
                const level = levelConfig[course.level] || levelConfig.beginner;
                const aiVideo = COURSE_VIDEOS[course.sort_order - 1];
                const motionVideo = MOTION_VIDEOS[course.sort_order - 1];

                return (
                  <motion.div
                    key={course.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Card className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-500 border-border/40 hover:border-primary/30 bg-card">
                      {/* Video Thumbnail */}
                      <div
                        className="relative w-full aspect-video bg-muted overflow-hidden"
                        onClick={() => setSelectedCourseId(course.id)}
                      >
                        {aiVideo && (
                          <video
                            src={aiVideo}
                            muted
                            loop
                            playsInline
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            onMouseOver={e => (e.target as HTMLVideoElement).play()}
                            onMouseOut={e => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-60 group-hover:opacity-40 transition-opacity" />

                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-14 h-14 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-primary/30 scale-90 group-hover:scale-100 transition-transform duration-300">
                            <Play className="h-6 w-6 text-primary-foreground ml-0.5" />
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                          <Badge className={`${level.color} text-[9px] font-semibold shadow-sm`}>{level.label}</Badge>
                          {hasCert && (
                            <Badge className="bg-primary/90 text-primary-foreground text-[9px] gap-0.5 shadow-sm">
                              <Award className="h-2.5 w-2.5" /> شهادة
                            </Badge>
                          )}
                        </div>

                        {/* Bottom info bar */}
                        <div className="absolute bottom-0 inset-x-0 px-3 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] text-white/90 font-medium">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration_minutes} د</span>
                            <span className="w-px h-3 bg-white/30" />
                            <span className="flex items-center gap-1"><PlayCircle className="h-3 w-3" /> {lessonsCount} دروس</span>
                          </div>
                          {/* Motion Graphics Button */}
                          {motionVideo && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setVideoDialog({ url: motionVideo, title: course.title + ' - موشن جرافيك' });
                              }}
                              className="flex items-center gap-1 text-[9px] text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full transition-all"
                            >
                              <Film className="h-2.5 w-2.5" /> موشن جرافيك
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <CardContent className="p-4 space-y-3" onClick={() => setSelectedCourseId(course.id)}>
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors shrink-0">
                            <IconComp className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-relaxed">
                              {course.title}
                            </h3>
                            {course.description && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{course.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">التقدم</span>
                            <span className="font-bold text-foreground">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>

                        {/* Action */}
                        <Button
                          variant={progress === 100 ? 'secondary' : progress > 0 ? 'default' : 'outline'}
                          size="sm"
                          className="w-full gap-2 text-xs h-9"
                        >
                          {progress === 100 ? <><CheckCircle className="h-3.5 w-3.5" /> مراجعة</> :
                           progress > 0 ? <><PlayCircle className="h-3.5 w-3.5" /> استئناف</> :
                           <><PlayCircle className="h-3.5 w-3.5" /> ابدأ التعلّم</>}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredCourses.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Search className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">لا توجد دورات مطابقة</p>
                <p className="text-xs text-muted-foreground mt-1">جرّب تغيير معايير البحث</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Video Dialog */}
      <Dialog open={!!videoDialog} onOpenChange={() => setVideoDialog(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden gap-0">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-bold text-foreground">{videoDialog?.title}</h3>
          </div>
          <div className="w-full bg-black">
            {videoDialog && (
              <video
                controls
                autoPlay
                className="w-full max-h-[70vh]"
                src={videoDialog.url}
              >
                متصفحك لا يدعم تشغيل الفيديو
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
