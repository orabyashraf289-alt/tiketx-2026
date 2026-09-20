import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n';

export default function Forbidden() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const ar = lang === 'ar';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-md space-y-4">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {ar ? 'لا تملك صلاحية الوصول' : 'Access denied'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {ar
            ? 'هذه الصفحة متاحة لمسؤولي النظام فقط. تواصل مع المسؤول إذا كنت تحتاج صلاحية إضافية.'
            : 'This page is restricted to system administrators. Contact an admin if you need access.'}
        </p>
        <Button onClick={() => navigate('/')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {ar ? 'العودة للرئيسية' : 'Back to home'}
        </Button>
      </div>
    </div>
  );
}
