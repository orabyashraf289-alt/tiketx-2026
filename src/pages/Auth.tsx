import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, Zap, BarChart3, CheckCircle2, Lock, Mail, ArrowLeft, Layers, Clock, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoImg from '@/assets/logo.png';
import { motion } from 'framer-motion';

const features = [
  { icon: Layers, title: 'إدارة مركزية', desc: 'نقطة واحدة لجميع الطلبات مع تصنيف تلقائي' },
  { icon: Clock, title: 'استجابة فورية', desc: 'SLA ذكي مع تصعيد آلي وإشعارات لحظية' },
  { icon: ShieldCheck, title: 'حماية متقدمة', desc: 'صلاحيات دقيقة ومراحل اعتماد متعددة' },
  { icon: BarChart3, title: 'تقارير تفاعلية', desc: 'لوحة تحكم شاملة مع تصدير للطباعة' },
];

export default function AuthPage() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      toast({ title: 'تم تسجيل الدخول بنجاح' });
    } catch (err: any) {
      toast({ title: 'خطأ في تسجيل الدخول', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setForgotSent(true);
      toast({ title: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني' });
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, hsl(152,30%,96%) 0%, hsl(160,25%,92%) 50%, hsl(145,20%,94%) 100%)' }}>
      {/* Left panel - branding (green side) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, hsl(152,45%,28%) 0%, hsl(158,40%,22%) 50%, hsl(165,35%,18%) 100%)' }}>
        {/* Decorative circles */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.12, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(152,55%,45%) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(160,50%,40%) 0%, transparent 70%)' }}
        />
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          <div className="max-w-lg">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
              className="flex items-center gap-4 mb-10"
            >
              <motion.div whileHover={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 0.5 }}>
                <img src={logoImg} alt="TicketFlow" className="h-14 w-14 rounded-2xl shadow-xl ring-2 ring-white/20" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-extrabold text-white">TicketFlow</h1>
                <p className="text-xs text-white/60 font-medium tracking-widest mt-0.5">SMART HELPDESK</p>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
              className="mb-10"
            >
              <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-3">
                أدِر طلباتك
                <br />
                <span className="text-emerald-300">بذكاء وكفاءة</span>
              </h2>
              <p className="text-sm text-white/60 leading-relaxed max-w-md">
                منصة متكاملة تجمع بين سهولة الاستخدام وقوة الأداء.
                من تقديم الطلب حتى إغلاقه — كل شيء تحت السيطرة.
              </p>
            </motion.div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3 mb-10">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
                  whileHover={{ y: -2, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  className="rounded-xl bg-white/[0.05] border border-white/[0.08] p-4 transition-all duration-300 cursor-default"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-400/20 flex items-center justify-center mb-2.5">
                    <f.icon className="h-4.5 w-4.5 text-emerald-300" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-0.5">{f.title}</h3>
                  <p className="text-[11px] text-white/45 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Trust */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex items-center gap-5 pt-6 border-t border-white/10"
            >
              {[
                { icon: ShieldCheck, t: 'تشفير كامل' },
                { icon: Zap, t: 'أداء عالي' },
                { icon: Users, t: 'متعدد المستخدمين' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <b.icon className="h-3.5 w-3.5 text-emerald-400/70" />
                  <span className="text-[11px] text-white/40">{b.t}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right panel - form (light side) */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-5 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 lg:hidden"
          >
            <img src={logoImg} alt="TicketFlow" className="h-12 w-12 mx-auto rounded-xl shadow-lg" />
            <h1 className="text-lg font-bold text-foreground mt-3">TicketFlow</h1>
            <p className="text-muted-foreground mt-1 text-xs">منصة إدارة الطلبات الذكية</p>
          </motion.div>

          {/* Login card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
            className="rounded-2xl bg-white shadow-xl shadow-black/[0.05] border border-black/[0.04] overflow-hidden relative"
          >
            {/* Top accent bar */}
            <div className="h-1.5" style={{ background: 'linear-gradient(90deg, hsl(152,45%,35%), hsl(160,50%,40%), hsl(152,45%,35%))' }} />

            <div className="p-7">
              {/* Icon + heading */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-7"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, hsl(152,45%,35%), hsl(160,50%,38%))' }}
                >
                  <Lock className="h-6 w-6 text-white" />
                </motion.div>
                <h2 className="text-xl font-bold text-gray-800">مرحباً بعودتك</h2>
                <p className="text-xs text-gray-400 mt-1">سجّل دخولك للوصول إلى لوحة التحكم</p>
              </motion.div>

              <form onSubmit={handleLogin} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="space-y-2"
                >
                  <Label htmlFor="email" className="text-gray-500 text-xs font-medium flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    dir="ltr"
                    className="h-12 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-300 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400 rounded-xl transition-all text-sm"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password" className="text-gray-500 text-xs font-medium flex items-center gap-1.5">
                    <Lock className="h-3 w-3" />
                    كلمة المرور
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    dir="ltr"
                    className="h-12 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-300 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400 rounded-xl transition-all text-sm"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="text-left"
                >
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.985 }}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 rounded-xl font-bold text-sm text-white shadow-lg shadow-emerald-600/20 transition-all duration-300 gap-2"
                      style={{ background: 'linear-gradient(135deg, hsl(152,45%,35%), hsl(160,50%,38%))' }}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          تسجيل الدخول
                          <ArrowLeft className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </form>

              {/* Forgot Password Modal */}
              {forgotMode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-0 bg-white rounded-2xl p-7 flex flex-col justify-center z-10"
                >
                  {forgotSent ? (
                    <div className="text-center">
                      <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-gray-800">تم الإرسال!</h3>
                      <p className="text-xs text-gray-400 mt-2 mb-6">تحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setForgotMode(false); setForgotSent(false); }}
                        className="text-xs"
                      >
                        العودة لتسجيل الدخول
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-6">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
                          style={{ background: 'linear-gradient(135deg, hsl(152,45%,35%), hsl(160,50%,38%))' }}>
                          <Mail className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">نسيت كلمة المرور</h3>
                        <p className="text-xs text-gray-400 mt-1">سنرسل لك رابط إعادة التعيين</p>
                      </div>
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-gray-500 text-xs">البريد الإلكتروني</Label>
                          <Input
                            type="email"
                            value={forgotEmail}
                            onChange={e => setForgotEmail(e.target.value)}
                            placeholder="name@company.com"
                            required
                            dir="ltr"
                            className="h-12 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-300 rounded-xl text-sm"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={forgotLoading}
                          className="w-full h-12 rounded-xl font-bold text-sm text-white shadow-lg gap-2"
                          style={{ background: 'linear-gradient(135deg, hsl(152,45%,35%), hsl(160,50%,38%))' }}
                        >
                          {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إرسال رابط الاستعادة'}
                        </Button>
                      </form>
                      <button
                        onClick={() => setForgotMode(false)}
                        className="text-xs text-gray-400 hover:text-gray-600 mt-4 mx-auto block"
                      >
                        العودة لتسجيل الدخول
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center text-gray-300 text-[11px] mt-6"
              >
                للحصول على حساب جديد، تواصل مع مسؤول النظام
              </motion.p>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-gray-400 text-[11px] mt-6"
          >
            © {new Date().getFullYear()} TicketFlow — جميع الحقوق محفوظة
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
