import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle, XCircle, Award, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import type { Json } from '@/integrations/supabase/types';

interface CourseQuizProps {
  courseId: string;
  courseName: string;
  onBack: () => void;
  onCertificateEarned: () => void;
}

export function CourseQuiz({ courseId, courseName, onBack, onCertificateEarned }: CourseQuizProps) {
  const { user } = useAuth();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: questions = [] } = useQuery({
    queryKey: ['training-quiz', courseId],
    queryFn: async () => {
      const { data } = await supabase.from('training_quiz_questions').select('*').eq('course_id', courseId).order('sort_order');
      return data || [];
    },
  });

  const handleAnswer = (optionIdx: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [currentQ]: optionIdx }));
  };

  const handleSubmit = async () => {
    if (!user || questions.length === 0) return;
    setSubmitted(true);
    const correctCount = questions.filter((q, i) => answers[i] === q.correct_option).length;
    const score = Math.round((correctCount / questions.length) * 100);

    if (score >= 60) {
      await supabase.from('training_certificates').upsert({
        user_id: user.id,
        course_id: courseId,
        score,
        issued_at: new Date().toISOString(),
      }, { onConflict: 'user_id,course_id' });
    }
  };

  const correctCount = questions.filter((q, i) => answers[i] === q.correct_option).length;
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const passed = score >= 60;
  const question = questions[currentQ];

  const getOptions = (options: Json): string[] => {
    if (Array.isArray(options)) return options.map(String);
    return [];
  };

  if (!question && !submitted) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-4">
          <ChevronLeft className="h-4 w-4" /> العودة
        </Button>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">لا توجد أسئلة لهذه الدورة بعد</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ChevronLeft className="h-4 w-4" /> العودة للدورة
      </Button>

      {submitted ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card>
            <CardContent className="py-12 text-center space-y-6">
              <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
                passed ? 'bg-success/10' : 'bg-destructive/10'
              }`}>
                {passed ? <Award className="h-10 w-10 text-success" /> : <XCircle className="h-10 w-10 text-destructive" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {passed ? '🎉 مبارك! لقد اجتزت الاختبار' : 'لم تجتز الاختبار'}
                </h2>
                <p className="text-muted-foreground mt-2">
                  حصلت على {correctCount} من {questions.length} ({score}%)
                </p>
                {!passed && <p className="text-sm text-muted-foreground mt-1">تحتاج 60% على الأقل للنجاح</p>}
              </div>
              <Progress value={score} className="h-3 max-w-xs mx-auto" />
              <div className="flex gap-3 justify-center">
                {passed ? (
                  <Button onClick={onCertificateEarned} className="gap-2">
                    <Award className="h-4 w-4" /> عرض الشهادة
                  </Button>
                ) : (
                  <Button onClick={() => { setSubmitted(false); setAnswers({}); setCurrentQ(0); }} className="gap-2">
                    <RotateCcw className="h-4 w-4" /> إعادة المحاولة
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">اختبار: {courseName}</CardTitle>
                <Badge variant="outline">
                  {currentQ + 1} / {questions.length}
                </Badge>
              </div>
              <Progress value={((currentQ + 1) / questions.length) * 100} className="h-1.5 mt-2" />
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQ}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-lg font-semibold mb-6 text-foreground">{question.question}</h3>
                  <div className="space-y-3">
                    {getOptions(question.options).map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        className={`w-full text-right p-4 rounded-xl border-2 transition-all ${
                          answers[currentQ] === idx
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40 hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            answers[currentQ] === idx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            {String.fromCharCode(0x623 + idx)}
                          </div>
                          <span className="text-sm font-medium text-foreground">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between mt-8 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentQ === 0}
                  onClick={() => setCurrentQ(prev => prev - 1)}
                >
                  السابق
                </Button>
                {currentQ < questions.length - 1 ? (
                  <Button
                    size="sm"
                    disabled={answers[currentQ] === undefined}
                    onClick={() => setCurrentQ(prev => prev + 1)}
                  >
                    التالي
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={Object.keys(answers).length < questions.length}
                    onClick={handleSubmit}
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" /> إرسال الإجابات
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
