import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft, Award } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface TrainingCertificateProps {
  certificate: { score: number; issued_at: string };
  courseName: string;
  onBack: () => void;
}

export function TrainingCertificate({ certificate, courseName, onBack }: TrainingCertificateProps) {
  const { profile } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Button variant="outline" size="sm" onClick={onBack} className="gap-2 text-xs">
        <ChevronLeft className="h-3.5 w-3.5" /> العودة
      </Button>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <Card className="overflow-hidden shadow-lg">
          <div className="bg-gradient-to-br from-primary/20 via-primary/5 to-accent/10 p-1.5">
            <CardContent className="bg-card rounded-xl py-16 px-8 text-center space-y-8 relative">
              {/* Decorative borders */}
              <div className="absolute inset-6 border-2 border-dashed border-primary/10 rounded-xl pointer-events-none" />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-lg shadow-primary/10"
              >
                <Award className="h-10 w-10 text-primary" />
              </motion.div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-[0.2em]">شهادة إتمام</p>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{courseName}</h1>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">تُمنح هذه الشهادة إلى</p>
                <p className="text-2xl font-bold text-primary">{profile?.full_name || 'المستخدم'}</p>
              </div>

              <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <div>
                  <p className="font-bold text-foreground text-xl">{certificate.score}%</p>
                  <p className="text-xs">النتيجة</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="font-bold text-foreground text-lg">
                    {format(new Date(certificate.issued_at), 'dd MMMM yyyy', { locale: ar })}
                  </p>
                  <p className="text-xs">تاريخ الإصدار</p>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-[11px] text-muted-foreground">
                  مركز التدريب • نظام إدارة التذاكر
                </p>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
