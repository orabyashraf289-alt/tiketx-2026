import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, Zap, BarChart3, CheckCircle2, Lock, Mail, ArrowLeft, Layers, Clock, Users, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sanitizeError } from '@/lib/errorHandler';
import logoImg from '@/assets/logo-icon.png';
import authBg from '@/assets/auth-bg.jpg';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemSettings } from '@/hooks/useSystemSettings';

const features = [
  { icon: Layers, title: 'إدارة مركزية', desc: 'نقطة واحدة لجميع الطلبات مع تصنيف تلقائي' },
  { icon: Clock, title: 'استجابة فورية', desc: 'SLA ذكي مع تصعيد آلي وإشعارات لحظية' },
  { icon: ShieldCheck, title: 'حماية متقدمة', desc: 'صلاحيات دقيقة ومراحل اعتماد متعددة' },
  { icon: BarChart3, title: 'تقارير تفاعلية', desc: 'لوحة تحكم شاملة مع تصدير للطباعة' },
];

const trustBadges = [
  { icon: ShieldCheck, t: 'تشفير كامل' },
  { icon: Zap, t: 'أداء عالي' },
  { icon: Users, t: 'متعدد المستخدمين' },
];

function LoginForm({ onForgot }: { onForgot: () => void }) {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast({ title: 'تم تسجيل الدخول بنجاح' });
    } catch (err: any) {
      toast({ title: 'خطأ في تسجيل الدخول', description: sanitizeError(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-1.5">
        <Label htmlFor="email" className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" />
          البريد الإلكتروني
        </Label>
        <Input
          id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="name@company.com" required dir="ltr"
          className="h-12 rounded-xl text-sm bg-muted/50 border-border/60 focus:bg-background transition-colors"
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-1.5">
        <Label htmlFor="password" className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" />
          كلمة المرور
        </Label>
        <div className="relative">
          <Input
            id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required dir="ltr"
            className="h-12 rounded-xl text-sm bg-muted/50 border-border/60 focus:bg-background transition-colors pl-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="text-left">
        <button type="button" onClick={onForgot} className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors font-medium">
          نسيت كلمة المرور؟
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
          <Button
            type="submit" disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-sm shadow-lg shadow-primary/25 transition-all duration-300 gap-2 gradient-accent text-primary-foreground"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>تسجيل الدخول<ArrowLeft className="h-4 w-4" /></>)}
          </Button>
        </motion.div>
      </motion.div>
    </form>
  );
}

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast({ title: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني' });
    } catch (err: any) {
      toast({ title: 'خطأ', description: sanitizeError(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
          <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
        </motion.div>
        <h3 className="text-lg font-bold text-foreground">تم الإرسال بنجاح!</h3>
        <p className="text-sm text-muted-foreground mt-2 mb-6 leading-relaxed">تحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور</p>
        <Button variant="outline" size="sm" onClick={onBack} className="rounded-xl">العودة لتسجيل الدخول</Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg gradient-accent">
          <Mail className="h-6 w-6 text-primary-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground">نسيت كلمة المرور</h3>
        <p className="text-xs text-muted-foreground mt-1">سنرسل لك رابط إعادة التعيين</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">البريد الإلكتروني</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" required dir="ltr" className="h-12 rounded-xl text-sm bg-muted/50 border-border/60" />
        </div>
        <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-bold text-sm gradient-accent text-primary-foreground shadow-lg gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إرسال رابط الاستعادة'}
        </Button>
      </form>
      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground mt-4 mx-auto block transition-colors">العودة لتسجيل الدخول</button>
    </motion.div>
  );
}

function BrandingPanel({ sysName, sysSub, logoSrc }: { sysName: string; sysSub: string; logoSrc: string }) {
  return (
    <div className="hidden lg:flex flex-1 relative overflow-hidden">
      {/* Background image */}
      <img src={authBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, hsl(222 35% 12% / 0.85) 0%, hsl(222 40% 10% / 0.92) 50%, hsl(225 35% 8% / 0.95) 100%)' }} />

      {/* Animated glow orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, hsl(217 72% 55%) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.12, 0.05] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="absolute -bottom-32 -left-16 w-[450px] h-[450px] rounded-full"
        style={{ background: 'radial-gradient(circle, hsl(199 89% 48%) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 w-full">
        <div className="max-w-lg">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-4 mb-12"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl shadow-2xl ring-1 ring-white/10 backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, hsl(217 72% 50% / 0.9), hsl(217 72% 58% / 0.9))' }}>
              <img src={logoSrc} alt={sysName} className="h-14 w-14 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{sysName}</h1>
              <p className="text-[11px] text-white/40 font-semibold tracking-[0.25em] mt-0.5">{sysSub}</p>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12"
          >
            <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.2] mb-4">
              أدِر طلباتك
              <br />
              <motion.span
                className="inline-block"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 6, repeat: Infinity }}
                style={{
                  backgroundImage: 'linear-gradient(90deg, hsl(217 72% 70%), hsl(199 89% 65%), hsl(38 92% 60%), hsl(217 72% 70%))',
                  backgroundSize: '300% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                بذكاء وكفاءة
              </motion.span>
            </h2>
            <p className="text-sm text-white/45 leading-relaxed max-w-md">
              منصة متكاملة تجمع بين سهولة الاستخدام وقوة الأداء.
              <br />
              من تقديم الطلب حتى إغلاقه — كل شيء تحت السيطرة.
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-3 mb-12">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -3, scale: 1.02 }}
                className="group rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5 backdrop-blur-sm transition-all duration-500 cursor-default hover:bg-white/[0.07] hover:border-white/[0.1]"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110" style={{ background: 'hsl(217 72% 50% / 0.15)' }}>
                  <f.icon className="h-5 w-5" style={{ color: 'hsl(217 72% 70%)' }} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                <p className="text-[11px] text-white/35 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-6 pt-6 border-t border-white/[0.06]"
          >
            {trustBadges.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'hsl(217 72% 50% / 0.1)' }}>
                  <b.icon className="h-3.5 w-3.5" style={{ color: 'hsl(217 72% 60% / 0.8)' }} />
                </div>
                <span className="text-[11px] text-white/30 font-medium">{b.t}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const sysSettings = useSystemSettings();
  const sysName = sysSettings.system_name || 'TicketFlow';
  const sysSub = sysSettings.system_subtitle || 'SMART HELPDESK';
  const logoSrc = sysSettings.logo_url || logoImg;
  const [forgotMode, setForgotMode] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel - branding */}
      <BrandingPanel sysName={sysName} sysSub={sysSub} logoSrc={logoSrc} />

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-6 sm:p-10 lg:max-w-[520px]">
        {/* Subtle background pattern for light side */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 0.5px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[380px] relative z-10"
        >
          {/* Mobile logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 lg:hidden"
          >
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl shadow-lg gradient-accent overflow-hidden">
              <img src={logoSrc} alt={sysName} className="h-12 w-12 object-contain" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground mt-3">{sysName}</h1>
            <p className="text-muted-foreground mt-1 text-xs">منصة إدارة الطلبات الذكية</p>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl bg-card shadow-2xl shadow-foreground/[0.06] border border-border/50 overflow-hidden relative"
          >
            {/* Top accent — animated gradient bar */}
            <motion.div
              className="h-1"
              style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(199 89% 48%), hsl(var(--primary)))' }}
              animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />

            <div className="p-8">
              <AnimatePresence mode="wait">
                {forgotMode ? (
                  <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                    <ForgotPasswordForm onBack={() => setForgotMode(false)} />
                  </motion.div>
                ) : (
                  <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                    {/* Header */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-center mb-8"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.25, type: 'spring', stiffness: 180, damping: 14 }}
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl gradient-accent ring-4 ring-primary/10"
                      >
                        <Lock className="h-7 w-7 text-primary-foreground" />
                      </motion.div>
                      <h2 className="text-2xl font-extrabold text-foreground">مرحباً بعودتك</h2>
                      <p className="text-sm text-muted-foreground mt-1.5">سجّل دخولك للوصول إلى لوحة التحكم</p>
                    </motion.div>

                    <LoginForm onForgot={() => setForgotMode(true)} />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-center text-muted-foreground text-[11px] mt-7 leading-relaxed">
                للحصول على حساب جديد، تواصل مع مسؤول النظام
              </motion.p>
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="text-center text-muted-foreground/60 text-[11px] mt-6">
            © {new Date().getFullYear()} {sysName} — جميع الحقوق محفوظة
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
