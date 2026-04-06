import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft, Award, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TrainingCertificateProps {
  certificate: { score: number; issued_at: string };
  courseName: string;
  onBack: () => void;
}

export function TrainingCertificate({ certificate, courseName, onBack }: TrainingCertificateProps) {
  const { profile } = useAuth();

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ChevronLeft className="h-4 w-4" /> العودة
      </Button>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/20 via-primary/5 to-accent/10 p-1">
          <CardContent className="bg-card rounded-lg py-16 px-8 text-center space-y-8 relative">
            {/* Decorative corners */}
            <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-primary/30 rounded-tr-lg" />
            <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-primary/30 rounded-tl-lg" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-primary/30 rounded-br-lg" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-primary/30 rounded-bl-lg" />

            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="h-10 w-10 text-primary" />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">شهادة إتمام</p>
              <h1 className="text-3xl font-bold text-foreground">{courseName}</h1>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground">تُمنح هذه الشهادة إلى</p>
              <p className="text-2xl font-bold text-primary">{profile?.full_name || 'المستخدم'}</p>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground text-lg">{certificate.score}%</p>
                <p>النتيجة</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="font-medium text-foreground text-lg">
                  {format(new Date(certificate.issued_at), 'dd MMMM yyyy', { locale: ar })}
                </p>
                <p>تاريخ الإصدار</p>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-xs text-muted-foreground">
                مركز التدريب • نظام إدارة التذاكر
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
