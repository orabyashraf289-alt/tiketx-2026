import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logoImg from '@/assets/logo.png';

export default function ResetPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    // Check hash for recovery type
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'كلمتا المرور غير متطابقتين', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast({ title: 'تم تغيير كلمة المرور بنجاح' });
      setTimeout(() => navigate('/auth'), 2000);
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-5">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
        className="w-full max-w-[400px]"
      >
        <div className="text-center mb-8">
          <img src={logoImg} alt="TicketFlow" className="h-12 w-12 mx-auto rounded-xl shadow-lg" />
          <h1 className="text-lg font-bold text-foreground mt-3">TicketFlow</h1>
        </div>

        <div className="rounded-2xl bg-card shadow-xl border overflow-hidden">
          <div className="h-1.5 gradient-primary" />
          <div className="p-7">
            {success ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-6"
              >
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-3" />
                <h2 className="text-lg font-bold text-foreground">تم التغيير بنجاح</h2>
                <p className="text-sm text-muted-foreground mt-2">جاري تحويلك لتسجيل الدخول...</p>
              </motion.div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Lock className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">إعادة تعيين كلمة المرور</h2>
                  <p className="text-xs text-muted-foreground mt-1">أدخل كلمة المرور الجديدة</p>
                </div>

                <form onSubmit={handleReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">كلمة المرور الجديدة</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      dir="ltr"
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">تأكيد كلمة المرور</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      dir="ltr"
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl font-bold text-sm gradient-primary text-primary-foreground shadow-lg gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تغيير كلمة المرور'}
                  </Button>
                </form>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-4 text-xs text-muted-foreground"
                  onClick={() => navigate('/auth')}
                >
                  <ArrowRight className="h-3 w-3 ml-1" />
                  العودة لتسجيل الدخول
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
