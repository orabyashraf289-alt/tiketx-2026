import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, Zap, BarChart3, CheckCircle2, Lock, Mail, ArrowLeft, ArrowRight, Layers, Clock, Users, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sanitizeError } from '@/lib/errorHandler';
import logoImg from '@/assets/logo-icon.png';
import authBg from '@/assets/auth-bg.jpg';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const LoginForm = ({ onForgot }: { onForgot: () => void }) => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast({ title: t.auth.loginSuccess });
    } catch (err: any) {
      toast({ title: t.auth.loginError, description: sanitizeError(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-1.5">
        <Label htmlFor="email" className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" />
          {t.auth.email}
        </Label>
        <Input
          id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="name@company.com" required dir="ltr"
          className="h-12 rounded-xl text-sm bg-white/[0.06] backdrop-blur-sm border-white/[0.12] focus:bg-white/[0.1] focus:border-white/[0.25] transition-all duration-300 text-foreground placeholder:text-muted-foreground/60"
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-1.5">
        <Label htmlFor="password" className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" />
          {t.auth.password}
        </Label>
        <div className="relative">
          <Input
            id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required dir="ltr"
            className="h-12 rounded-xl text-sm bg-white/[0.06] backdrop-blur-sm border-white/[0.12] focus:bg-white/[0.1] focus:border-white/[0.25] transition-all duration-300 ltr:pr-11 rtl:pl-11 text-foreground placeholder:text-muted-foreground/60"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="ltr:text-right rtl:text-left">
        <button type="button" onClick={onForgot} className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors font-medium">
          {t.auth.forgotPassword}
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
          <Button
            type="submit" disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-sm shadow-lg shadow-primary/25 transition-all duration-300 gap-2 gradient-accent text-primary-foreground backdrop-blur-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>{t.auth.login}<ArrowIcon className="h-4 w-4" /></>)}
          </Button>
        </motion.div>
      </motion.div>
    </form>
  );
};

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const { t } = useLanguage();
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
      toast({ title: t.auth.resetSent });
    } catch (err: any) {
      toast({ title: t.auth.error, description: sanitizeError(err), variant: 'destructive' });
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
        <h3 className="text-lg font-bold text-foreground">{t.auth.resetSentTitle}</h3>
        <p className="text-sm text-muted-foreground mt-2 mb-6 leading-relaxed">{t.auth.resetSentDesc}</p>
        <Button variant="outline" size="sm" onClick={onBack} className="rounded-xl backdrop-blur-sm bg-white/[0.06] border-white/[0.12]">{t.auth.backToLogin}</Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg gradient-accent backdrop-blur-sm">
          <Mail className="h-6 w-6 text-primary-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground">{t.auth.forgotPasswordTitle}</h3>
        <p className="text-xs text-muted-foreground mt-1">{t.auth.forgotPasswordDesc}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">{t.auth.email}</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" required dir="ltr" className="h-12 rounded-xl text-sm bg-white/[0.06] backdrop-blur-sm border-white/[0.12] focus:bg-white/[0.1] focus:border-white/[0.25] transition-all duration-300" />
        </div>
        <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-bold text-sm gradient-accent text-primary-foreground shadow-lg gap-2 backdrop-blur-sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.auth.sendResetLink}
        </Button>
      </form>
      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground mt-4 mx-auto block transition-colors">{t.auth.backToLogin}</button>
    </motion.div>
  );
}

function BrandingPanel({ sysName, sysSub, logoSrc }: { sysName: string; sysSub: string; logoSrc: string }) {
  const { t } = useLanguage();

  const features = [
    { icon: Layers, title: t.auth.features.centralMgmt, desc: t.auth.features.centralMgmtDesc },
    { icon: Clock, title: t.auth.features.instantResponse, desc: t.auth.features.instantResponseDesc },
    { icon: ShieldCheck, title: t.auth.features.advancedProtection, desc: t.auth.features.advancedProtectionDesc },
    { icon: BarChart3, title: t.auth.features.interactiveReports, desc: t.auth.features.interactiveReportsDesc },
  ];

  const trustBadges = [
    { icon: ShieldCheck, t: t.auth.trust.encryption },
    { icon: Zap, t: t.auth.trust.performance },
    { icon: Users, t: t.auth.trust.multiUser },
  ];

  return (
    <div className="hidden lg:flex flex-1 relative overflow-hidden">
      <img src={authBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, hsl(222 35% 12% / 0.85) 0%, hsl(222 40% 10% / 0.92) 50%, hsl(225 35% 8% / 0.95) 100%)' }} />

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

      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 6 + i * 4, height: 6 + i * 4,
            background: `hsl(217 72% 70% / ${0.08 + i * 0.03})`,
            backdropFilter: 'blur(4px)',
            top: `${15 + i * 18}%`, left: `${10 + i * 15}%`,
          }}
          animate={{ y: [0, -20, 0], x: [0, 10, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 5 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
        />
      ))}

      <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 w-full">
        <div className="max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="flex items-center gap-4 mb-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl shadow-2xl ring-1 ring-white/10 backdrop-blur-md" style={{ background: 'linear-gradient(135deg, hsl(217 72% 50% / 0.6), hsl(217 72% 58% / 0.4))' }}>
              <img src={logoSrc} alt={sysName} className="h-14 w-14 object-contain drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{sysName}</h1>
              <p className="text-[11px] text-white/40 font-semibold tracking-[0.25em] mt-0.5">{sysSub}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="mb-12">
            <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.2] mb-4">
              {t.auth.heroTitle1}
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
                {t.auth.heroTitle2}
              </motion.span>
            </h2>
            <p className="text-sm text-white/45 leading-relaxed max-w-md whitespace-pre-line">
              {t.auth.heroDesc}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 mb-12">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -3, scale: 1.02 }}
                className="group rounded-2xl p-5 cursor-default transition-all duration-500 hover:shadow-lg hover:shadow-white/[0.03]"
                style={{
                  background: 'linear-gradient(135deg, hsl(217 30% 20% / 0.35), hsl(220 25% 15% / 0.2))',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid hsl(217 40% 50% / 0.1)',
                  boxShadow: 'inset 0 1px 0 0 hsl(217 60% 80% / 0.05)',
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110"
                  style={{ background: 'hsl(217 72% 50% / 0.12)', backdropFilter: 'blur(8px)', border: '1px solid hsl(217 60% 60% / 0.1)' }}>
                  <f.icon className="h-5 w-5" style={{ color: 'hsl(217 72% 70%)' }} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                <p className="text-[11px] text-white/35 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="flex items-center gap-6 pt-6" style={{ borderTop: '1px solid hsl(217 40% 50% / 0.1)' }}>
            {trustBadges.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'hsl(217 72% 50% / 0.08)', backdropFilter: 'blur(8px)', border: '1px solid hsl(217 60% 60% / 0.08)' }}>
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
  const { t, isRTL } = useLanguage();
  const sysName = sysSettings.system_name || 'TicketFlow';
  const sysSub = sysSettings.system_subtitle || 'SMART HELPDESK';
  const logoSrc = sysSettings.logo_url || logoImg;
  const [forgotMode, setForgotMode] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      <BrandingPanel sysName={sysName} sysSub={sysSub} logoSrc={logoSrc} />

      <div className="flex-1 flex items-center justify-center relative z-10 p-6 sm:p-10 lg:max-w-[520px] overflow-hidden">
        {/* Language switcher - top corner */}
        <div className="absolute top-4 ltr:right-4 rtl:left-4 z-20">
          <LanguageSwitcher variant="outline" />
        </div>

        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.07] pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-20 ltr:-right-20 rtl:-left-20 w-[300px] h-[300px] rounded-full opacity-[0.05] pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(199 89% 48%) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        <div className="absolute inset-0 opacity-[0.02]" style={{
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
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center mb-8 lg:hidden">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl shadow-lg gradient-accent overflow-hidden backdrop-blur-sm">
              <img src={logoSrc} alt={sysName} className="h-12 w-12 object-contain" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground mt-3">{sysName}</h1>
            <p className="text-muted-foreground mt-1 text-xs">{t.auth.heroTitle2}</p>
          </motion.div>

          {/* Glassmorphism Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl overflow-hidden relative"
            style={{
              background: 'linear-gradient(145deg, hsl(var(--card) / 0.7), hsl(var(--card) / 0.5))',
              backdropFilter: 'blur(24px) saturate(1.4)',
              border: '1px solid hsl(var(--border) / 0.3)',
              boxShadow: `0 25px 50px -12px hsl(var(--foreground) / 0.08), 0 0 0 1px hsl(var(--border) / 0.1), inset 0 1px 0 0 hsl(var(--card) / 0.5)`,
            }}
          >
            <motion.div
              className="h-[2px]"
              style={{
                background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), hsl(199 89% 48%), hsl(var(--primary)), transparent)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />

            <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
              style={{ background: 'linear-gradient(180deg, hsl(var(--card) / 0.3) 0%, transparent 100%)' }} />

            <div className="p-8 relative">
              <AnimatePresence mode="wait">
                {forgotMode ? (
                  <motion.div key="forgot" initial={{ opacity: 0, x: isRTL ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRTL ? 20 : -20 }} transition={{ duration: 0.3 }}>
                    <ForgotPasswordForm onBack={() => setForgotMode(false)} />
                  </motion.div>
                ) : (
                  <motion.div key="login" initial={{ opacity: 0, x: isRTL ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRTL ? -20 : 20 }} transition={{ duration: 0.3 }}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center mb-8">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.25, type: 'spring', stiffness: 180, damping: 14 }}
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl ring-4 ring-primary/10 relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.8), hsl(var(--primary)))', backdropFilter: 'blur(8px)' }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                        <Lock className="h-7 w-7 text-primary-foreground relative z-10" />
                      </motion.div>
                      <h2 className="text-2xl font-extrabold text-foreground">
                        {isRTL ? 'مرحباً بعودتك' : 'Welcome Back'}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1.5">
                        {isRTL ? 'سجّل دخولك للوصول إلى لوحة التحكم' : 'Sign in to access your dashboard'}
                      </p>
                    </motion.div>

                    <LoginForm onForgot={() => setForgotMode(true)} />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-center text-muted-foreground text-[11px] mt-7 leading-relaxed">
                {isRTL ? 'للحصول على حساب جديد، تواصل مع مسؤول النظام' : 'To get a new account, contact your system administrator'}
              </motion.p>
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="text-center text-muted-foreground/60 text-[11px] mt-6">
            © {new Date().getFullYear()} {sysName} — {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
