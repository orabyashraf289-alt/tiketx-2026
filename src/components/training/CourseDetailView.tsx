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
  ChevronLeft, Award, FileText,
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          العودة للدورات
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lessons sidebar */}
        <Card className="lg:col-span-1 order-2 lg:order-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">الدروس ({lessons.length})</CardTitle>
              <Badge variant="outline">{progressPercent}%</Badge>
            </div>
            <Progress value={progressPercent} className="h-1.5 mt-2" />
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="px-4 pb-4 space-y-1">
                {lessons.map((lesson, idx) => {
                  const isCompleted = completedLessonIds.has(lesson.id);
                  const isActive = activeLessonIndex === idx;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLessonIndex(idx)}
                      className={`w-full text-right flex items-center gap-3 p-3 rounded-lg transition-all ${
                        isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <Circle className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                          {idx + 1}. {lesson.title}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" /> {lesson.duration_minutes} دقيقة
                          {lesson.video_url && <><span className="mx-1">·</span><PlayCircle className="h-3 w-3" /> فيديو</>}
                        </p>
                      </div>
                    </button>
                  );
                })}

                <Separator className="my-3" />

                {/* Quiz button */}
                <button
                  onClick={() => allLessonsCompleted && setShowQuiz(true)}
                  disabled={!allLessonsCompleted}
                  className={`w-full text-right flex items-center gap-3 p-3 rounded-lg transition-all ${
                    allLessonsCompleted ? 'hover:bg-warning/10 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <FileText className={`h-5 w-5 shrink-0 ${certificate ? 'text-success' : 'text-warning'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{certificate ? 'إعادة الاختبار' : 'الاختبار النهائي'}</p>
                    <p className="text-xs text-muted-foreground">
                      {allLessonsCompleted ? 'جاهز للاختبار' : 'أكمل جميع الدروس أولاً'}
                    </p>
                  </div>
                </button>

                {certificate && (
                  <button
                    onClick={() => setShowCertificate(true)}
                    className="w-full text-right flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-all"
                  >
                    <Award className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary">عرض الشهادة</p>
                      <p className="text-xs text-muted-foreground">النتيجة: {certificate.score}%</p>
                    </div>
                  </button>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Content area */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <AnimatePresence mode="wait">
            {activeLesson ? (
              <motion.div
                key={activeLesson.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          الدرس {activeLessonIndex! + 1} من {lessons.length}
                        </p>
                        <CardTitle className="text-lg">{activeLesson.title}</CardTitle>
                      </div>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" /> {activeLesson.duration_minutes} دقيقة
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {activeLesson.video_url && (
                      <div className="mb-6 rounded-xl overflow-hidden border border-border bg-black">
                        <video
                          key={activeLesson.id}
                          controls
                          className="w-full max-h-[450px]"
                          poster=""
                        >
                          <source src={activeLesson.video_url} />
                          متصفحك لا يدعم تشغيل الفيديو
                        </video>
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none dark:prose-invert text-foreground">
                      <ReactMarkdown>{activeLesson.content}</ReactMarkdown>
                    </div>

                    <div className="flex items-center justify-between mt-8 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={activeLessonIndex === 0}
                        onClick={() => setActiveLessonIndex(prev => (prev ?? 1) - 1)}
                        className="gap-2"
                      >
                        <ArrowRight className="h-4 w-4" /> السابق
                      </Button>

                      <div className="flex gap-2">
                        {!completedLessonIds.has(activeLesson.id) && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => completeLessonMutation.mutate(activeLesson.id)}
                            className="gap-2"
                          >
                            <CheckCircle className="h-4 w-4" /> إتمام الدرس
                          </Button>
                        )}
                        {activeLessonIndex! < lessons.length - 1 && (
                          <Button
                            size="sm"
                            variant={completedLessonIds.has(activeLesson.id) ? 'default' : 'outline'}
                            onClick={() => setActiveLessonIndex(prev => (prev ?? 0) + 1)}
                            className="gap-2"
                          >
                            التالي <ArrowRight className="h-4 w-4 rotate-180" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card>
                  <CardContent className="py-16 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{course?.title}</h2>
                      <p className="text-muted-foreground mt-1">{course?.description}</p>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {course?.duration_minutes} دقيقة</span>
                      <span className="flex items-center gap-1"><PlayCircle className="h-4 w-4" /> {lessons.length} دروس</span>
                      {course?.level && <Badge className={levelColors[course.level]}>{levelLabels[course.level]}</Badge>}
                    </div>
                    <Button onClick={() => setActiveLessonIndex(0)} className="gap-2 mt-4">
                      <PlayCircle className="h-4 w-4" />
                      {progressPercent > 0 ? 'استئناف الدورة' : 'ابدأ الدورة'}
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
