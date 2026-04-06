import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle, Circle, Clock, BookOpen, PlayCircle,
  ChevronLeft, Award, FileText, Lock, Sparkles,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CourseQuiz } from './CourseQuiz';
import { TrainingCertificate } from './TrainingCertificate';

interface CourseDetailViewProps {
  courseId: string;
  onBack: () => void;
}

export function CourseDetailView({ courseId, onBack }: CourseDetailViewProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeLessonIndex, setActiveLessonIndex] = useState<number | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  const { data: course } = useQuery({
    queryKey: ['training-course', courseId],
    queryFn: async () => {
      const { data } = await supabase.from('training_courses').select('*').eq('id', courseId).single();
      return data;
    },
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['training-lessons', courseId],
    queryFn: async () => {
      const { data } = await supabase.from('training_lessons').select('*').eq('course_id', courseId).order('sort_order');
      return data || [];
    },
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['training-progress', courseId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('training_progress').select('*').eq('course_id', courseId).eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: certificate } = useQuery({
    queryKey: ['training-certificate', courseId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('training_certificates').select('*').eq('course_id', courseId).eq('user_id', user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user) return;
      await supabase.from('training_progress').upsert({
        user_id: user.id,
        lesson_id: lessonId,
        course_id: courseId,
        completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,lesson_id' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-progress', courseId] });
      queryClient.invalidateQueries({ queryKey: ['training-progress-all'] });
    },
  });

  const completedLessonIds = useMemo(() => new Set(progress.filter(p => p.completed).map(p => p.lesson_id)), [progress]);
  const progressPercent = lessons.length > 0 ? Math.round((completedLessonIds.size / lessons.length) * 100) : 0;
  const allLessonsCompleted = lessons.length > 0 && completedLessonIds.size === lessons.length;
  const activeLesson = activeLessonIndex !== null ? lessons[activeLessonIndex] : null;

  const levelLabels: Record<string, string> = { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' };
  const levelColors: Record<string, string> = {
    beginner: 'bg-success/10 text-success border-success/20',
    intermediate: 'bg-warning/10 text-warning border-warning/20',
    advanced: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  if (showCertificate && certificate) {
    return <TrainingCertificate certificate={certificate} courseName={course?.title || ''} onBack={() => setShowCertificate(false)} />;
  }

  if (showQuiz) {
    return (
      <CourseQuiz
        courseId={courseId}
        courseName={course?.title || ''}
        onBack={() => setShowQuiz(false)}
        onCertificateEarned={() => {
          setShowQuiz(false);
          setShowCertificate(true);
          queryClient.invalidateQueries({ queryKey: ['training-certificate', courseId] });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & course title */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2 text-xs">
          <ChevronLeft className="h-3.5 w-3.5" />
          العودة للدورات
        </Button>
        {course && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{course.title}</span>
            {course.level && <Badge className={`${levelColors[course.level]} text-[10px]`}>{levelLabels[course.level]}</Badge>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lessons sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 order-2 lg:order-1">
          <Card className="sticky top-20">
            <CardHeader className="pb-3 space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  المحتوى ({lessons.length} دروس)
                </CardTitle>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">{completedLessonIds.size} من {lessons.length} مكتمل</span>
                  <span className="font-bold text-primary">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-320px)] max-h-[550px]">
                <div className="px-3 pb-3 space-y-0.5">
                  {lessons.map((lesson, idx) => {
                    const isCompleted = completedLessonIds.has(lesson.id);
                    const isActive = activeLessonIndex === idx;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLessonIndex(idx)}
                        className={`w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-xs ${
                          isActive
                            ? 'bg-primary/10 border border-primary/20 shadow-sm'
                            : 'hover:bg-muted/60'
                        }`}
                      >
                        <div className="shrink-0">
                          {isCompleted ? (
                            <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
                              <CheckCircle className="h-3.5 w-3.5 text-success" />
                            </div>
                          ) : (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}>
                              {idx + 1}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                            {lesson.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-2.5 w-2.5" /> {lesson.duration_minutes} د
                            {lesson.video_url && (
                              <>
                                <span className="mx-0.5">·</span>
                                <PlayCircle className="h-2.5 w-2.5" /> فيديو
                              </>
                            )}
                          </p>
                        </div>
                      </button>
                    );
                  })}

                  <Separator className="my-2" />

                  {/* Quiz */}
                  <button
                    onClick={() => allLessonsCompleted && setShowQuiz(true)}
                    disabled={!allLessonsCompleted}
                    className={`w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-xs ${
                      allLessonsCompleted
                        ? 'hover:bg-warning/10 cursor-pointer'
                        : 'opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                      {allLessonsCompleted
                        ? <FileText className="h-3.5 w-3.5 text-warning" />
                        : <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{certificate ? 'إعادة الاختبار' : 'الاختبار النهائي'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {allLessonsCompleted ? 'جاهز للاختبار' : 'أكمل جميع الدروس'}
                      </p>
                    </div>
                  </button>

                  {certificate && (
                    <button
                      onClick={() => setShowCertificate(true)}
                      className="w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-all text-xs"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Award className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-primary">عرض الشهادة</p>
                        <p className="text-[10px] text-muted-foreground">النتيجة: {certificate.score}%</p>
                      </div>
                    </button>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Content area */}
        <div className="lg:col-span-8 xl:col-span-9 order-1 lg:order-2">
          <AnimatePresence mode="wait">
            {activeLesson ? (
              <motion.div
                key={activeLesson.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className="overflow-hidden">
                  {/* Video */}
                  {activeLesson.video_url && (
                    <div className="w-full bg-black">
                      <video
                        key={activeLesson.id}
                        controls
                        className="w-full max-h-[480px]"
                      >
                        <source src={activeLesson.video_url} />
                        متصفحك لا يدعم تشغيل الفيديو
                      </video>
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          الدرس {activeLessonIndex! + 1} من {lessons.length}
                        </p>
                        <CardTitle className="text-lg">{activeLesson.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <Clock className="h-3 w-3" /> {activeLesson.duration_minutes} دقيقة
                        </Badge>
                        {completedLessonIds.has(activeLesson.id) && (
                          <Badge className="bg-success/10 text-success border-success/20 text-[10px] gap-1">
                            <CheckCircle className="h-3 w-3" /> مكتمل
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert text-foreground leading-relaxed">
                      <ReactMarkdown>{activeLesson.content}</ReactMarkdown>
                    </div>

                    <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={activeLessonIndex === 0}
                        onClick={() => setActiveLessonIndex(prev => (prev ?? 1) - 1)}
                        className="gap-2 text-xs"
                      >
                        <ArrowRight className="h-3.5 w-3.5" /> الدرس السابق
                      </Button>

                      <div className="flex gap-2">
                        {!completedLessonIds.has(activeLesson.id) && (
                          <Button
                            size="sm"
                            onClick={() => completeLessonMutation.mutate(activeLesson.id)}
                            className="gap-2 text-xs"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> إتمام الدرس
                          </Button>
                        )}
                        {activeLessonIndex! < lessons.length - 1 && (
                          <Button
                            size="sm"
                            variant={completedLessonIds.has(activeLesson.id) ? 'default' : 'outline'}
                            onClick={() => setActiveLessonIndex(prev => (prev ?? 0) + 1)}
                            className="gap-2 text-xs"
                          >
                            الدرس التالي <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="overflow-hidden">
                  {/* Course Intro Video */}
                  {course?.intro_video_url && (
                    <div className="w-full bg-black">
                      <video
                        controls
                        autoPlay
                        muted
                        loop
                        className="w-full max-h-[400px] object-cover"
                      >
                        <source src={course.intro_video_url} />
                      </video>
                    </div>
                  )}

                  <CardContent className="py-12 text-center space-y-5">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
                    >
                      <BookOpen className="h-8 w-8 text-primary" />
                    </motion.div>

                    <div>
                      <h2 className="text-xl font-bold text-foreground">{course?.title}</h2>
                      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">{course?.description}</p>
                    </div>

                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {course?.duration_minutes} دقيقة</span>
                      <span className="w-px h-4 bg-border" />
                      <span className="flex items-center gap-1.5"><PlayCircle className="h-4 w-4" /> {lessons.length} دروس</span>
                      {course?.level && (
                        <>
                          <span className="w-px h-4 bg-border" />
                          <Badge className={levelColors[course.level]}>{levelLabels[course.level]}</Badge>
                        </>
                      )}
                    </div>

                    {progressPercent > 0 && progressPercent < 100 && (
                      <div className="max-w-xs mx-auto space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">تقدمك الحالي</span>
                          <span className="font-bold text-primary">{progressPercent}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    )}

                    <Button onClick={() => setActiveLessonIndex(0)} size="lg" className="gap-2 mt-2">
                      <PlayCircle className="h-5 w-5" />
                      {progressPercent > 0 ? 'استئناف الدورة' : 'ابدأ التعلّم الآن'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
