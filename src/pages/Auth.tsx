import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, Lock, Mail, ArrowLeft, ArrowRight, Eye, EyeOff, Sparkles, Shield, Zap, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sanitizeError } from '@/lib/errorHandler';
import logoImg from '@/assets/logo-icon.png';
import authBg from '@/assets/auth-bg.jpg';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

/* ─── Animated Mesh Background ─── */
const MeshBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <img src={authBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,40%,6%,0.6)] via-[hsl(222,35%,8%,0.7)] to-[hsl(222,30%,4%,0.85)]" />

    {/* Orbiting glow rings */}
    {[0, 1, 2].map(i => (
      <motion.div
        key={`ring-${i}`}
        className="absolute rounded-full border"
        style={{
          width: 300 + i * 200,
          height: 300 + i * 200,
          top: '50%', left: '50%',
          x: '-50%', y: '-50%',
          borderColor: `hsl(217 72% 55% / ${0.06 - i * 0.015})`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30 + i * 20, repeat: Infinity, ease: 'linear' }}
      />
    ))}

    {/* Floating particles */}
    {Array.from({ length: 20 }).map((_, i) => (
      <motion.div
        key={`p-${i}`}
        className="absolute rounded-full"
        style={{
          width: 2 + Math.random() * 4,
          height: 2 + Math.random() * 4,
          background: `hsl(${200 + Math.random() * 30} 80% 70% / ${0.15 + Math.random() * 0.3})`,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -40 - Math.random() * 60, 0],
          x: [0, 15 - Math.random() * 30, 0],
          opacity: [0.2, 0.8, 0.2],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 4 + Math.random() * 6,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: Math.random() * 5,
        }}
      />
    ))}

    {/* Primary glow */}
    <motion.div
      className="absolute w-[600px] h-[600px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(217 72% 55% / 0.12) 0%, transparent 70%)',
        top: '20%', right: '-10%',
      }}
      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(199 89% 48% / 0.08) 0%, transparent 70%)',
        bottom: '-5%', left: '-5%',
      }}
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
    />
  </div>
);

/* ─── Animated Logo ─── */
const AnimatedLogo = ({ src, name }: { src: string; name: string }) => (
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: 'spring', stiffness: 150, damping: 18, delay: 0.2 }}
    className="relative mx-auto mb-6"
  >
    {/* Outer pulse ring */}
    <motion.div
      className="absolute inset-0 rounded-3xl"
      style={{ background: 'hsl(217 72% 55% / 0.15)' }}
      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    />
    {/* Logo container */}
    <div
      className="relative w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden mx-auto"
      style={{
        background: 'linear-gradient(145deg, hsl(217 72% 45%), hsl(217 72% 55%), hsl(199 89% 48%))',
        boxShadow: '0 20px 60px -15px hsl(217 72% 50% / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.2)',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent" />
      <motion.img
        src={src}
        alt={name}
        className="relative z-10 h-14 w-14 object-contain drop-shadow-lg"
        animate={{ rotateY: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  </motion.div>
);

/* ─── Feature Cards for Left Panel ─── */
const FeatureOrbit = ({ t }: { t: any }) => {
  const features = [
    { icon: Shield, label: t.auth?.features?.advancedProtection || 'Advanced Security', color: 'hsl(152 55% 45%)' },
    { icon: Zap, label: t.auth?.features?.instantResponse || 'Instant Response', color: 'hsl(38 92% 55%)' },
    { icon: Globe, label: t.auth?.features?.centralMgmt || 'Central Management', color: 'hsl(199 89% 50%)' },
    { icon: Sparkles, label: t.auth?.features?.interactiveReports || 'AI Reports', color: 'hsl(280 70% 60%)' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mt-10">
      {features.map((f, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.8 + i * 0.15, type: 'spring', stiffness: 120 }}
          whileHover={{ y: -6, scale: 1.05 }}
          className="relative rounded-2xl p-5 cursor-default group"
          style={{
            background: 'linear-gradient(135deg, hsl(220 30% 15% / 0.5), hsl(220 25% 12% / 0.3))',
            backdropFilter: 'blur(20px)',
            border: '1px solid hsl(217 40% 50% / 0.1)',
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: `linear-gradient(135deg, ${f.color.replace(')', ' / 0.08)')}, transparent)` }}
          />
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 relative"
            style={{ background: f.color.replace(')', ' / 0.12)'), border: `1px solid ${f.color.replace(')', ' / 0.15)')}` }}
          >
            <f.icon className="h-5 w-5" style={{ color: f.color }} />
          </div>
          <h3 className="text-sm font-bold text-white/90">{f.label}</h3>
        </motion.div>
      ))}
    </div>
  );
};

/* ─── Login Form ─── */
const LoginForm = ({ onForgot }: { onForgot: () => void }) => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
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
  }, [email, password, signIn, toast, t]);

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const inputClass = "h-12 rounded-xl text-sm bg-white/[0.04] border-white/[0.08] focus:bg-white/[0.08] focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all duration-300 text-foreground placeholder:text-muted-foreground/50";

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <motion.div initial={{ opacity: 0, x: isRTL ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="space-y-1.5">
        <Label htmlFor="email" className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" />
          {t.auth.email}
        </Label>
        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" required dir="ltr" className={inputClass} />
      </motion.div>

      <motion.div initial={{ opacity: 0, x: isRTL ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="space-y-1.5">
        <Label htmlFor="password" className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" />
          {t.auth.password}
        </Label>
        <div className="relative">
          <Input
            id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required dir="ltr"
            className={`${inputClass} ltr:pr-11 rtl:pl-11`}
          />
          <button
            type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="ltr:text-right rtl:text-left">
        <button type="button" onClick={onForgot} className="text-xs text-primary/80 hover:text-primary hover:underline transition-colors font-medium">
          {t.auth.forgotPassword}
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit" disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-sm gap-2 relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, hsl(217 72% 50%), hsl(217 72% 58%), hsl(199 89% 50%))',
              backgroundSize: '200% 200%',
              boxShadow: '0 8px 32px -8px hsl(217 72% 50% / 0.5)',
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, hsl(217 72% 50%), hsl(217 72% 58%), hsl(199 89% 50%))' }}
              animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            />
            <span className="relative z-10 flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>{t.auth.login}<ArrowIcon className="h-4 w-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" /></>)}
            </span>
          </Button>
        </motion.div>
      </motion.div>
    </form>
  );
};

/* ─── Forgot Password ─── */
const ForgotPasswordForm = ({ onBack }: { onBack: () => void }) => {
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
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
          <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
        </motion.div>
        <h3 className="text-lg font-bold text-foreground">{t.auth.resetSentTitle}</h3>
        <p className="text-sm text-muted-foreground mt-2 mb-6">{t.auth.resetSentDesc}</p>
        <Button variant="outline" size="sm" onClick={onBack} className="rounded-xl">{t.auth.backToLogin}</Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, hsl(217 72% 50%), hsl(199 89% 48%))' }}>
          <Mail className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-foreground">{t.auth.forgotPasswordTitle}</h3>
        <p className="text-xs text-muted-foreground mt-1">{t.auth.forgotPasswordDesc}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">{t.auth.email}</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" required dir="ltr"
            className="h-12 rounded-xl text-sm bg-white/[0.04] border-white/[0.08] focus:bg-white/[0.08] focus:border-primary/50 transition-all" />
        </div>
        <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-bold text-sm gap-2"
          style={{ background: 'linear-gradient(135deg, hsl(217 72% 50%), hsl(199 89% 48%))' }}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.auth.sendResetLink}
        </Button>
      </form>
      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground mt-4 mx-auto block transition-colors">{t.auth.backToLogin}</button>
    </motion.div>
  );
};

/* ─── Main Auth Page ─── */
export default function AuthPage() {
  const sysSettings = useSystemSettings();
  const { t, isRTL } = useLanguage();
  const sysName = sysSettings.system_name || 'TicketFlow';
  const sysSub = sysSettings.system_subtitle || 'SMART HELPDESK';
  const logoSrc = sysSettings.logo_url || logoImg;
  const [forgotMode, setForgotMode] = useState(false);

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'hsl(222 35% 6%)' }}>
      <MeshBackground />

      {/* Language switcher */}
      <div className="absolute top-5 ltr:right-5 rtl:left-5 z-50">
        <LanguageSwitcher variant="outline" />
      </div>

      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex flex-1 relative z-10 items-center justify-center p-12 xl:p-20">
        <div className="max-w-lg">
          {/* Logo + Name */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-5 mb-14"
          >
            <motion.div
              className="h-20 w-20 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, hsl(217 72% 45%), hsl(217 72% 55%), hsl(199 89% 48%))',
                boxShadow: '0 25px 60px -15px hsl(217 72% 50% / 0.5)',
              }}
              whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
              transition={{ duration: 0.6 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent" />
              <img src={logoSrc} alt={sysName} className="h-14 w-14 object-contain drop-shadow-lg relative z-10" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{sysName}</h1>
              <motion.p
                className="text-[11px] font-semibold tracking-[0.3em] mt-1"
                style={{ color: 'hsl(199 89% 60%)' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {sysSub}
              </motion.p>
            </div>
          </motion.div>

          {/* Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-4xl xl:text-[3.2rem] font-extrabold text-white leading-[1.15] mb-5">
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
            <p className="text-sm text-white/40 leading-relaxed max-w-md whitespace-pre-line">
              {t.auth.heroDesc}
            </p>
          </motion.div>

          {/* Feature Cards */}
          <FeatureOrbit t={t} />

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="flex items-center gap-3 mt-10 pt-6"
            style={{ borderTop: '1px solid hsl(217 40% 50% / 0.1)' }}
          >
            {[
              { label: t.auth?.trust?.encryption || '256-bit', icon: Shield },
              { label: t.auth?.trust?.performance || '99.9%', icon: Zap },
              { label: t.auth?.trust?.multiUser || 'Multi-User', icon: Globe },
            ].map((b, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: 'hsl(217 30% 20% / 0.3)', border: '1px solid hsl(217 40% 50% / 0.08)' }}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <b.icon className="h-3.5 w-3.5" style={{ color: 'hsl(217 72% 65%)' }} />
                <span className="text-[11px] text-white/35 font-medium">{b.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Right Login Panel ── */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-6 sm:p-10 lg:max-w-[520px]">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px] relative"
        >
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <AnimatedLogo src={logoSrc} name={sysName} />
            <h1 className="text-xl font-extrabold text-foreground">{sysName}</h1>
            <p className="text-muted-foreground mt-1 text-xs">{t.auth.heroTitle2}</p>
          </div>

          {/* Card */}
          <motion.div
            className="rounded-3xl overflow-hidden relative"
            style={{
              background: 'linear-gradient(145deg, hsl(222 28% 14% / 0.8), hsl(222 25% 10% / 0.6))',
              backdropFilter: 'blur(40px) saturate(1.5)',
              border: '1px solid hsl(217 40% 50% / 0.12)',
              boxShadow: '0 30px 60px -15px hsl(0 0% 0% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.05)',
            }}
          >
            {/* Top shimmer bar */}
            <motion.div
              className="h-[2px] relative overflow-hidden"
              style={{ background: 'hsl(217 30% 20% / 0.3)' }}
            >
              <motion.div
                className="absolute inset-y-0 w-1/3"
                style={{ background: 'linear-gradient(90deg, transparent, hsl(217 72% 60%), hsl(199 89% 55%), transparent)' }}
                animate={{ left: ['-33%', '133%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
              />
            </motion.div>

            <div className="p-8 sm:p-9 relative">
              <AnimatePresence mode="wait">
                {forgotMode ? (
                  <motion.div key="forgot" initial={{ opacity: 0, x: isRTL ? -30 : 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRTL ? 30 : -30 }} transition={{ duration: 0.35 }}>
                    <ForgotPasswordForm onBack={() => setForgotMode(false)} />
                  </motion.div>
                ) : (
                  <motion.div key="login" initial={{ opacity: 0, x: isRTL ? 30 : -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRTL ? -30 : 30 }} transition={{ duration: 0.35 }}>
                    {/* Login header */}
                    <div className="text-center mb-8 hidden lg:block">
                      <AnimatedLogo src={logoSrc} name={sysName} />
                      <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="text-2xl font-extrabold text-foreground"
                      >
                        {isRTL ? 'مرحباً بعودتك' : 'Welcome Back'}
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-sm text-muted-foreground mt-1.5"
                      >
                        {isRTL ? 'سجّل دخولك للوصول إلى لوحة التحكم' : 'Sign in to access your dashboard'}
                      </motion.p>
                    </div>

                    <LoginForm onForgot={() => setForgotMode(true)} />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center text-muted-foreground/50 text-[11px] mt-7 leading-relaxed"
              >
                {isRTL ? 'للحصول على حساب جديد، تواصل مع مسؤول النظام' : 'To get a new account, contact your system administrator'}
              </motion.p>
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="text-center text-white/20 text-[11px] mt-6">
            © {new Date().getFullYear()} {sysName} — {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
