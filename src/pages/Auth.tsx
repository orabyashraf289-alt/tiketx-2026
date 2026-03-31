import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, Lock, Mail, ArrowLeft, ArrowRight, Eye, EyeOff, Shield, Zap, Globe, BarChart3, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sanitizeError } from '@/lib/errorHandler';
import logoImg from '@/assets/logo-icon.png';
import authBg from '@/assets/auth-bg.jpg';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

/* ─── Color Palette Constants ─── */
const C = {
  orange: 'hsl(25 95% 58%)',
  orangeGlow: 'hsl(25 95% 58% / 0.15)',
  pink: 'hsl(330 80% 60%)',
  pinkGlow: 'hsl(330 80% 60% / 0.12)',
  cyan: 'hsl(185 85% 55%)',
  cyanGlow: 'hsl(185 85% 55% / 0.12)',
  gradientBtn: 'linear-gradient(135deg, hsl(25 95% 55%), hsl(330 80% 58%), hsl(185 85% 52%))',
  gradientText: 'linear-gradient(90deg, hsl(25 95% 65%), hsl(330 80% 65%), hsl(185 85% 60%), hsl(25 95% 65%))',
  gradientShimmer: 'linear-gradient(90deg, transparent, hsl(25 95% 60%), hsl(330 80% 60%), hsl(185 85% 55%), transparent)',
};

/* ─── Animated Background ─── */
const AuroraBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <img src={authBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, hsl(0 0% 3% / 0.5) 0%, hsl(260 20% 5% / 0.6) 50%, hsl(0 0% 3% / 0.7) 100%)' }} />

    {/* Morphing blob - orange */}
    <motion.div
      className="absolute w-[500px] h-[500px]"
      style={{
        background: `radial-gradient(circle, ${C.orangeGlow} 0%, transparent 70%)`,
        top: '5%', left: '10%',
        filter: 'blur(60px)',
      }}
      animate={{
        x: [0, 80, -40, 0],
        y: [0, -50, 30, 0],
        scale: [1, 1.3, 0.9, 1],
      }}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* Morphing blob - pink */}
    <motion.div
      className="absolute w-[450px] h-[450px]"
      style={{
        background: `radial-gradient(circle, ${C.pinkGlow} 0%, transparent 70%)`,
        top: '40%', right: '5%',
        filter: 'blur(50px)',
      }}
      animate={{
        x: [0, -60, 40, 0],
        y: [0, 60, -30, 0],
        scale: [1, 0.8, 1.2, 1],
      }}
      transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
    />

    {/* Morphing blob - cyan */}
    <motion.div
      className="absolute w-[400px] h-[400px]"
      style={{
        background: `radial-gradient(circle, ${C.cyanGlow} 0%, transparent 70%)`,
        bottom: '0%', left: '30%',
        filter: 'blur(55px)',
      }}
      animate={{
        x: [0, 50, -80, 0],
        y: [0, -40, 20, 0],
        scale: [1, 1.15, 0.85, 1],
      }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
    />

    {/* Floating sparkle particles */}
    {Array.from({ length: 30 }).map((_, i) => {
      const colors = [C.orange, C.pink, C.cyan];
      const color = colors[i % 3];
      return (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + Math.random() * 3,
            height: 2 + Math.random() * 3,
            background: color,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            boxShadow: `0 0 6px ${color}`,
          }}
          animate={{
            y: [0, -(30 + Math.random() * 50), 0],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: Math.random() * 6,
          }}
        />
      );
    })}
  </div>
);

/* ─── Animated Counter ─── */
const AnimatedCounter = ({ target, suffix = '' }: { target: number; suffix?: string }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, v => `${Math.round(v)}${suffix}`);
  useEffect(() => {
    const ctrl = animate(count, target, { duration: 2, ease: 'easeOut' });
    return ctrl.stop;
  }, [target, count]);
  return <motion.span>{rounded}</motion.span>;
};

/* ─── Animated Logo with Breathing Ring ─── */
const BreathingLogo = ({ src, name, size = 'lg' }: { src: string; name: string; size?: 'sm' | 'lg' }) => {
  const s = size === 'lg' ? 'w-24 h-24' : 'w-16 h-16';
  const imgS = size === 'lg' ? 'h-16 w-16' : 'h-10 w-10';
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.15 }}
      className="relative mx-auto"
    >
      {/* Breathing ring 1 */}
      <motion.div
        className={`absolute inset-0 ${s} rounded-[28px] mx-auto`}
        style={{ border: `2px solid hsl(25 95% 58% / 0.2)` }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Breathing ring 2 */}
      <motion.div
        className={`absolute inset-0 ${s} rounded-[28px] mx-auto`}
        style={{ border: `2px solid hsl(185 85% 55% / 0.15)` }}
        animate={{ scale: [1, 1.45, 1], opacity: [0.2, 0, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
      {/* Logo */}
      <div
        className={`relative ${s} rounded-[28px] flex items-center justify-center mx-auto overflow-hidden`}
        style={{
          background: C.gradientBtn,
          boxShadow: `0 20px 50px -15px hsl(25 95% 55% / 0.35), 0 10px 30px -10px hsl(330 80% 58% / 0.2)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(45deg, transparent 40%, hsl(0 0% 100% / 0.15) 50%, transparent 60%)',
            backgroundSize: '200% 200%',
          }}
          animate={{ backgroundPosition: ['200% 200%', '-50% -50%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
        />
        <img src={src} alt={name} className={`relative z-10 ${imgS} object-contain drop-shadow-lg`} />
      </div>
    </motion.div>
  );
};

/* ─── Feature Stats Row ─── */
const StatsRow = ({ t }: { t: any }) => {
  const stats = [
    { value: 99.9, suffix: '%', label: t.auth?.trust?.performance || 'Uptime', color: C.orange },
    { value: 256, suffix: '-bit', label: t.auth?.trust?.encryption || 'Encryption', color: C.pink },
    { value: 50, suffix: 'K+', label: t.auth?.trust?.multiUser || 'Users', color: C.cyan },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 }}
      className="flex gap-3 mt-10"
    >
      {stats.map((s, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-2xl p-4 text-center relative overflow-hidden group cursor-default"
          style={{
            background: 'hsl(0 0% 100% / 0.03)',
            backdropFilter: 'blur(16px)',
            border: '1px solid hsl(0 0% 100% / 0.06)',
          }}
          whileHover={{ y: -4, scale: 1.03 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: `radial-gradient(circle at center, ${s.color.replace(')', ' / 0.08)')}, transparent 70%)` }}
          />
          <div className="text-xl font-extrabold text-white" style={{ textShadow: `0 0 20px ${s.color.replace(')', ' / 0.4)')}` }}>
            <AnimatedCounter target={s.value} suffix={s.suffix} />
          </div>
          <div className="text-[10px] text-white/30 mt-1 font-medium">{s.label}</div>
        </motion.div>
      ))}
    </motion.div>
  );
};

/* ─── Feature Cards ─── */
const FeatureCards = ({ t }: { t: any }) => {
  const features = [
    { icon: Shield, label: t.auth?.features?.advancedProtection || 'Advanced Security', color: C.orange },
    { icon: Zap, label: t.auth?.features?.instantResponse || 'Instant Response', color: C.pink },
    { icon: Layers, label: t.auth?.features?.centralMgmt || 'Central Management', color: C.cyan },
    { icon: BarChart3, label: t.auth?.features?.interactiveReports || 'AI Reports', color: C.orange },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mt-8">
      {features.map((f, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 25, rotateX: 15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.6 + i * 0.12, type: 'spring', stiffness: 100 }}
          whileHover={{ y: -5, scale: 1.04, rotateY: 3 }}
          className="rounded-2xl p-5 cursor-default group relative overflow-hidden"
          style={{
            background: 'hsl(0 0% 100% / 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid hsl(0 0% 100% / 0.06)',
          }}
        >
          {/* Hover gradient reveal */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{ background: `linear-gradient(135deg, ${f.color.replace(')', ' / 0.06)')}, transparent 70%)` }}
          />
          {/* Corner accent */}
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: `radial-gradient(circle at top right, ${f.color.replace(')', ' / 0.1)')}, transparent 70%)` }}
          />
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
            style={{ background: f.color.replace(')', ' / 0.1)'), border: `1px solid ${f.color.replace(')', ' / 0.15)')}` }}
          >
            <f.icon className="h-5 w-5" style={{ color: f.color }} />
          </div>
          <h3 className="text-sm font-bold text-white/85">{f.label}</h3>
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
  const [focused, setFocused] = useState<string | null>(null);

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

  const inputWrapperClass = (field: string) =>
    `relative rounded-xl transition-all duration-500 ${focused === field ? 'ring-1 shadow-lg' : ''}`;

  const inputStyle = (field: string) => ({
    ...(focused === field
      ? { ringColor: C.orange, boxShadow: `0 0 20px ${C.orangeGlow}` }
      : {}),
  });

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      {/* Email */}
      <motion.div initial={{ opacity: 0, x: isRTL ? 25 : -25 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, type: 'spring', stiffness: 120 }} className="space-y-1.5">
        <Label htmlFor="email" className="text-white/50 text-xs font-medium flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" /> {t.auth.email}
        </Label>
        <div className={inputWrapperClass('email')} style={inputStyle('email')}>
          <Input
            id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
            placeholder="name@company.com" required dir="ltr"
            className="h-12 rounded-xl text-sm bg-white/[0.04] border-white/[0.08] focus:bg-white/[0.07] focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 text-white placeholder:text-white/25"
          />
        </div>
      </motion.div>

      {/* Password */}
      <motion.div initial={{ opacity: 0, x: isRTL ? 25 : -25 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, type: 'spring', stiffness: 120 }} className="space-y-1.5">
        <Label htmlFor="password" className="text-white/50 text-xs font-medium flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" /> {t.auth.password}
        </Label>
        <div className={inputWrapperClass('password')} style={inputStyle('password')}>
          <Input
            id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
            onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
            placeholder="••••••••" required dir="ltr"
            className="h-12 rounded-xl text-sm bg-white/[0.04] border-white/[0.08] focus:bg-white/[0.07] focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 ltr:pr-11 rtl:pl-11 text-white placeholder:text-white/25"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>

      {/* Forgot */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="ltr:text-right rtl:text-left">
        <button type="button" onClick={onForgot} className="text-xs font-medium transition-colors" style={{ color: C.orange }}>
          {t.auth.forgotPassword}
        </button>
      </motion.div>

      {/* Submit */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
          <Button type="submit" disabled={loading} className="w-full h-13 rounded-xl font-bold text-sm gap-2 relative overflow-hidden border-0 text-white"
            style={{
              background: C.gradientBtn,
              backgroundSize: '200% 200%',
              boxShadow: `0 10px 35px -8px hsl(25 95% 55% / 0.4), 0 5px 15px -5px hsl(330 80% 58% / 0.2)`,
            }}
          >
            {/* Shimmer sweep */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, hsl(0 0% 100% / 0.2) 50%, transparent 60%)',
                backgroundSize: '200% 200%',
              }}
              animate={{ backgroundPosition: ['200% 0%', '-50% 0%'] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
            />
            <span className="relative z-10 flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>{t.auth.login}<ArrowIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
              )}
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (error) throw error;
      setSent(true);
      toast({ title: t.auth.resetSent });
    } catch (err: any) {
      toast({ title: t.auth.error, description: sanitizeError(err), variant: 'destructive' });
    } finally { setLoading(false); }
  };

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
          <CheckCircle2 className="h-16 w-16 mx-auto mb-4" style={{ color: C.cyan }} />
        </motion.div>
        <h3 className="text-lg font-bold text-white">{t.auth.resetSentTitle}</h3>
        <p className="text-sm text-white/40 mt-2 mb-6">{t.auth.resetSentDesc}</p>
        <Button variant="outline" size="sm" onClick={onBack} className="rounded-xl border-white/10 text-white/70 hover:bg-white/5">{t.auth.backToLogin}</Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: C.gradientBtn }}>
          <Mail className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-white">{t.auth.forgotPasswordTitle}</h3>
        <p className="text-xs text-white/40 mt-1">{t.auth.forgotPasswordDesc}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-white/50 text-xs">{t.auth.email}</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" required dir="ltr"
            className="h-12 rounded-xl text-sm bg-white/[0.04] border-white/[0.08] focus:bg-white/[0.07] focus-visible:ring-0 text-white placeholder:text-white/25 transition-all" />
        </div>
        <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-bold text-sm gap-2 border-0 text-white"
          style={{ background: C.gradientBtn, boxShadow: `0 8px 30px -8px hsl(25 95% 55% / 0.4)` }}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.auth.sendResetLink}
        </Button>
      </form>
      <button onClick={onBack} className="text-xs text-white/30 hover:text-white/60 mt-4 mx-auto block transition-colors">{t.auth.backToLogin}</button>
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
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'hsl(0 0% 4%)' }}>
      <AuroraBackground />

      {/* Language switcher */}
      <div className="absolute top-5 ltr:right-5 rtl:left-5 z-50">
        <LanguageSwitcher variant="outline" />
      </div>

      {/* ── Left Branding ── */}
      <div className="hidden lg:flex flex-1 relative z-10 items-center justify-center p-12 xl:p-20">
        <div className="max-w-lg w-full">
          {/* Logo + Name */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-5 mb-12"
          >
            <motion.div
              className="h-20 w-20 rounded-[24px] flex items-center justify-center shadow-2xl relative overflow-hidden shrink-0"
              style={{
                background: C.gradientBtn,
                boxShadow: `0 25px 50px -15px hsl(25 95% 55% / 0.4)`,
              }}
              whileHover={{ rotate: [0, -8, 8, -4, 0] }}
              transition={{ duration: 0.8 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
              <img src={logoSrc} alt={sysName} className="h-14 w-14 object-contain drop-shadow-lg relative z-10" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{sysName}</h1>
              <motion.p
                className="text-[11px] font-bold tracking-[0.3em] mt-1"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 4, repeat: Infinity }}
                style={{
                  backgroundImage: C.gradientText,
                  backgroundSize: '300% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {sysSub}
              </motion.p>
            </div>
          </motion.div>

          {/* Hero Text */}
          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}>
            <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.12] mb-5">
              {t.auth.heroTitle1}
              <br />
              <motion.span
                className="inline-block"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 5, repeat: Infinity }}
                style={{
                  backgroundImage: C.gradientText,
                  backgroundSize: '300% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {t.auth.heroTitle2}
              </motion.span>
            </h2>
            <p className="text-sm text-white/35 leading-relaxed max-w-md whitespace-pre-line">{t.auth.heroDesc}</p>
          </motion.div>

          {/* Feature Cards */}
          <FeatureCards t={t} />

          {/* Stats */}
          <StatsRow t={t} />
        </div>
      </div>

      {/* ── Right Login ── */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-6 sm:p-10 lg:max-w-[520px]">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px] relative"
        >
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <BreathingLogo src={logoSrc} name={sysName} size="sm" />
            <h1 className="text-xl font-extrabold text-white mt-4">{sysName}</h1>
            <p className="text-white/40 mt-1 text-xs">{t.auth.heroTitle2}</p>
          </div>

          {/* Glassmorphism Card */}
          <motion.div
            className="rounded-3xl overflow-hidden relative"
            style={{
              background: 'hsl(0 0% 100% / 0.03)',
              backdropFilter: 'blur(40px) saturate(1.5)',
              border: '1px solid hsl(0 0% 100% / 0.07)',
              boxShadow: '0 30px 60px -15px hsl(0 0% 0% / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.05)',
            }}
          >
            {/* Gradient shimmer top bar */}
            <div className="h-[2px] relative overflow-hidden" style={{ background: 'hsl(0 0% 100% / 0.04)' }}>
              <motion.div
                className="absolute inset-y-0 w-1/3"
                style={{ background: C.gradientShimmer }}
                animate={{ left: ['-33%', '133%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
              />
            </div>

            <div className="p-8 sm:p-9 relative">
              <AnimatePresence mode="wait">
                {forgotMode ? (
                  <motion.div key="forgot" initial={{ opacity: 0, x: isRTL ? -30 : 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRTL ? 30 : -30 }} transition={{ duration: 0.35 }}>
                    <ForgotPasswordForm onBack={() => setForgotMode(false)} />
                  </motion.div>
                ) : (
                  <motion.div key="login" initial={{ opacity: 0, x: isRTL ? 30 : -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRTL ? -30 : 30 }} transition={{ duration: 0.35 }}>
                    {/* Header */}
                    <div className="text-center mb-8 hidden lg:block">
                      <BreathingLogo src={logoSrc} name={sysName} size="lg" />
                      <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="text-2xl font-extrabold text-white mt-5">
                        {isRTL ? 'مرحباً بعودتك' : 'Welcome Back'}
                      </motion.h2>
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                        className="text-sm text-white/40 mt-1.5">
                        {isRTL ? 'سجّل دخولك للوصول إلى لوحة التحكم' : 'Sign in to access your dashboard'}
                      </motion.p>
                    </div>
                    <LoginForm onForgot={() => setForgotMode(true)} />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                className="text-center text-white/20 text-[11px] mt-7 leading-relaxed">
                {isRTL ? 'للحصول على حساب جديد، تواصل مع مسؤول النظام' : 'To get a new account, contact your system administrator'}
              </motion.p>
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="text-center text-white/15 text-[11px] mt-6">
            © {new Date().getFullYear()} {sysName} — {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
