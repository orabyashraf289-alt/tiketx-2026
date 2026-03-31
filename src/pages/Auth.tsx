import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, Lock, Mail, ArrowLeft, ArrowRight, Eye, EyeOff, Shield, Zap, BookOpen, Globe, GraduationCap, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sanitizeError } from '@/lib/errorHandler';
import logoImg from '@/assets/logo-icon.png';
import authBg from '@/assets/auth-bg.jpg';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

/* ─── Classera Brand Palette ─── */
const BRAND = {
  teal: '#0d8a8a',
  tealLight: '#1aacac',
  tealDark: '#077272',
  tealBg: 'hsl(180 82% 30% / 0.08)',
  gradientBtn: 'linear-gradient(135deg, #0d8a8a, #1aacac, #0d8a8a)',
  gradientHero: 'linear-gradient(135deg, #0d8a8a 0%, #1aacac 50%, #3cc0c0 100%)',
};

/* ─── Decorative SVG Wave ─── */
const WaveDecoration = () => (
  <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none" style={{ height: 120 }}>
    <motion.path
      d="M0,60 C360,120 720,0 1080,60 C1260,90 1350,60 1440,40 L1440,120 L0,120 Z"
      fill={BRAND.teal}
      fillOpacity={0.04}
      animate={{ d: [
        "M0,60 C360,120 720,0 1080,60 C1260,90 1350,60 1440,40 L1440,120 L0,120 Z",
        "M0,40 C360,0 720,120 1080,40 C1260,10 1350,50 1440,70 L1440,120 L0,120 Z",
        "M0,60 C360,120 720,0 1080,60 C1260,90 1350,60 1440,40 L1440,120 L0,120 Z",
      ]}}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.path
      d="M0,80 C480,30 960,100 1440,60 L1440,120 L0,120 Z"
      fill={BRAND.teal}
      fillOpacity={0.06}
      animate={{ d: [
        "M0,80 C480,30 960,100 1440,60 L1440,120 L0,120 Z",
        "M0,50 C480,100 960,20 1440,80 L1440,120 L0,120 Z",
        "M0,80 C480,30 960,100 1440,60 L1440,120 L0,120 Z",
      ]}}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
    />
  </svg>
);

/* ─── Left Branding Panel ─── */
const BrandingPanel = ({ sysName, sysSub, logoSrc, t }: { sysName: string; sysSub: string; logoSrc: string; t: any }) => {
  const features = [
    { icon: Shield, title: t.auth?.features?.advancedProtection || 'Advanced Security', desc: t.auth?.features?.advancedProtectionDesc || 'Enterprise-grade data protection' },
    { icon: Zap, title: t.auth?.features?.instantResponse || 'Smart Automation', desc: t.auth?.features?.instantResponseDesc || 'AI-powered ticket routing' },
    { icon: BookOpen, title: t.auth?.features?.centralMgmt || 'Knowledge Base', desc: t.auth?.features?.centralMgmtDesc || 'Centralized help resources' },
    { icon: GraduationCap, title: t.auth?.features?.interactiveReports || 'Analytics', desc: t.auth?.features?.interactiveReportsDesc || 'Real-time insights & reports' },
  ];

  return (
    <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #f0fafa 0%, #e6f7f7 30%, #ffffff 100%)' }}>
      {/* Background image with overlay */}
      <img src={authBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />

      {/* Teal accent bar on the side */}
      <div className="absolute top-0 ltr:left-0 rtl:right-0 bottom-0 w-1" style={{ background: BRAND.gradientHero }} />

      {/* Floating teal circles */}
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full"
        style={{ background: `radial-gradient(circle, ${BRAND.teal}12, transparent 70%)`, top: '-5%', right: '10%' }}
        animate={{ scale: [1, 1.2, 1], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[280px] h-[280px] rounded-full"
        style={{ background: `radial-gradient(circle, ${BRAND.teal}10, transparent 70%)`, bottom: '15%', left: '5%' }}
        animate={{ scale: [1, 1.15, 1], x: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      {/* Small floating dots */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4 + i * 2,
            height: 4 + i * 2,
            background: BRAND.teal,
            opacity: 0.08 + i * 0.02,
            top: `${12 + i * 10}%`,
            left: `${8 + i * 11}%`,
          }}
          animate={{ y: [0, -12, 0], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
        />
      ))}

      <WaveDecoration />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full px-12 xl:px-20">
        <div className="max-w-lg">
          {/* Logo + Name */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-4 mb-10"
          >
            <motion.div
              className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden shrink-0"
              style={{ background: BRAND.gradientHero, boxShadow: `0 12px 35px -8px ${BRAND.teal}50` }}
              whileHover={{ scale: 1.05, rotate: 3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
              <img src={logoSrc} alt={sysName} className="h-10 w-10 object-contain relative z-10 drop-shadow-md" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: '#1a2b3c' }}>{sysName}</h1>
              <p className="text-xs font-semibold tracking-[0.2em] mt-0.5" style={{ color: BRAND.teal }}>{sysSub}</p>
            </div>
          </motion.div>

          {/* Hero Title */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7 }}>
            <h2 className="text-4xl xl:text-[2.8rem] font-extrabold leading-[1.2] mb-4" style={{ color: '#1a2b3c' }}>
              {t.auth.heroTitle1}
              <br />
              <span style={{ color: BRAND.teal }}>{t.auth.heroTitle2}</span>
            </h2>
            <p className="text-sm leading-relaxed max-w-md whitespace-pre-line" style={{ color: '#6b7c8d' }}>
              {t.auth.heroDesc}
            </p>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-3 mt-10">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4, boxShadow: `0 12px 30px -8px ${BRAND.teal}20` }}
                className="rounded-2xl p-5 cursor-default group transition-shadow duration-300"
                style={{
                  background: 'hsl(0 0% 100% / 0.75)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid hsl(180 30% 90%)',
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${BRAND.teal}12`, border: `1px solid ${BRAND.teal}20` }}>
                  <f.icon className="h-5 w-5" style={{ color: BRAND.teal }} />
                </div>
                <h3 className="text-sm font-bold mb-1" style={{ color: '#1a2b3c' }}>{f.title}</h3>
                <p className="text-[11px] leading-relaxed" style={{ color: '#8899aa' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex items-center gap-5 mt-10 pt-6"
            style={{ borderTop: `1px solid ${BRAND.teal}15` }}
          >
            {[
              { icon: Shield, label: t.auth?.trust?.encryption || 'Encrypted' },
              { icon: Award, label: t.auth?.trust?.performance || '99.9% Uptime' },
              { icon: Globe, label: t.auth?.trust?.multiUser || 'Multi-Tenant' },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${BRAND.teal}0a` }}>
                  <b.icon className="h-3.5 w-3.5" style={{ color: BRAND.teal }} />
                </div>
                <span className="text-[11px] font-medium" style={{ color: '#8899aa' }}>{b.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
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
    } finally { setLoading(false); }
  }, [email, password, signIn, toast, t]);

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const inputCls = "h-12 rounded-xl text-sm bg-white border-[hsl(180_20%_88%)] focus:border-[#0d8a8a] focus:ring-2 focus:ring-[#0d8a8a]/20 transition-all duration-300 text-[#1a2b3c] placeholder:text-[#aabbcc]";

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#5a6b7c' }}>
          <Mail className="h-3.5 w-3.5" /> {t.auth.email}
        </Label>
        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="name@classera.com" required dir="ltr" className={inputCls} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#5a6b7c' }}>
          <Lock className="h-3.5 w-3.5" /> {t.auth.password}
        </Label>
        <div className="relative">
          <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required dir="ltr" className={`${inputCls} ltr:pr-11 rtl:pl-11`} />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: '#aabbcc' }}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="ltr:text-right rtl:text-left">
        <button type="button" onClick={onForgot} className="text-xs font-semibold hover:underline transition-colors" style={{ color: BRAND.teal }}>
          {t.auth.forgotPassword}
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <motion.div whileHover={{ scale: 1.015, y: -1 }} whileTap={{ scale: 0.985 }}>
          <Button type="submit" disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-sm text-white border-0 gap-2 relative overflow-hidden"
            style={{
              background: BRAND.gradientHero,
              boxShadow: `0 8px 25px -6px ${BRAND.teal}60`,
            }}>
            {/* Shimmer */}
            <motion.div className="absolute inset-0"
              style={{ background: 'linear-gradient(105deg, transparent 40%, hsl(0 0% 100% / 0.2) 50%, transparent 60%)', backgroundSize: '200% 200%' }}
              animate={{ backgroundPosition: ['200% 0%', '-50% 0%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
            />
            <span className="relative z-10 flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>{t.auth.login}<ArrowIcon className="h-4 w-4" /></>)}
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
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
          <CheckCircle2 className="h-16 w-16 mx-auto mb-4" style={{ color: BRAND.teal }} />
        </motion.div>
        <h3 className="text-lg font-bold" style={{ color: '#1a2b3c' }}>{t.auth.resetSentTitle}</h3>
        <p className="text-sm mt-2 mb-6" style={{ color: '#6b7c8d' }}>{t.auth.resetSentDesc}</p>
        <Button variant="outline" size="sm" onClick={onBack} className="rounded-xl">{t.auth.backToLogin}</Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: BRAND.gradientHero }}>
          <Mail className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-bold" style={{ color: '#1a2b3c' }}>{t.auth.forgotPasswordTitle}</h3>
        <p className="text-xs mt-1" style={{ color: '#6b7c8d' }}>{t.auth.forgotPasswordDesc}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold" style={{ color: '#5a6b7c' }}>{t.auth.email}</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@classera.com" required dir="ltr"
            className="h-12 rounded-xl text-sm bg-white border-[hsl(180_20%_88%)] focus:border-[#0d8a8a] focus:ring-2 focus:ring-[#0d8a8a]/20 text-[#1a2b3c] placeholder:text-[#aabbcc] transition-all" />
        </div>
        <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-bold text-sm gap-2 border-0 text-white"
          style={{ background: BRAND.gradientHero, boxShadow: `0 8px 25px -6px ${BRAND.teal}60` }}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.auth.sendResetLink}
        </Button>
      </form>
      <button onClick={onBack} className="text-xs mt-4 mx-auto block transition-colors hover:underline" style={{ color: '#8899aa' }}>{t.auth.backToLogin}</button>
    </motion.div>
  );
};

/* ─── Main Auth Page ─── */
export default function AuthPage() {
  const sysSettings = useSystemSettings();
  const { t, isRTL } = useLanguage();
  const sysName = sysSettings.system_name || 'Classera';
  const sysSub = sysSettings.system_subtitle || 'SMART HELPDESK';
  const logoSrc = sysSettings.logo_url || logoImg;
  const [forgotMode, setForgotMode] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fbfb' }}>
      {/* Left Branding */}
      <BrandingPanel sysName={sysName} sysSub={sysSub} logoSrc={logoSrc} t={t} />

      {/* Right Login Panel */}
      <div className="flex-1 flex items-center justify-center relative p-6 sm:p-10 lg:max-w-[520px] overflow-hidden" style={{ background: '#f8fbfb' }}>
        {/* Language switcher */}
        <div className="absolute top-5 ltr:right-5 rtl:left-5 z-20">
          <LanguageSwitcher variant="outline" />
        </div>

        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${BRAND.teal} 0.5px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px] relative z-10"
        >
          {/* Mobile logo */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center mb-8 lg:hidden">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl shadow-lg overflow-hidden" style={{ background: BRAND.gradientHero }}>
              <img src={logoSrc} alt={sysName} className="h-10 w-10 object-contain" />
            </div>
            <h1 className="text-xl font-extrabold mt-3" style={{ color: '#1a2b3c' }}>{sysName}</h1>
            <p className="text-xs mt-1" style={{ color: BRAND.teal }}>{t.auth.heroTitle2}</p>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-3xl overflow-hidden relative"
            style={{
              background: 'white',
              border: '1px solid hsl(180 15% 92%)',
              boxShadow: `0 20px 50px -15px ${BRAND.teal}15, 0 0 0 1px hsl(180 15% 94%)`,
            }}
          >
            {/* Top accent line */}
            <div className="h-1 relative overflow-hidden">
              <motion.div
                className="absolute inset-0"
                style={{ background: BRAND.gradientHero }}
              />
              <motion.div
                className="absolute inset-y-0 w-1/4"
                style={{ background: 'linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.5), transparent)' }}
                animate={{ left: ['-25%', '125%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
              />
            </div>

            <div className="p-8 sm:p-9">
              <AnimatePresence mode="wait">
                {forgotMode ? (
                  <motion.div key="forgot"
                    initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    transition={{ duration: 0.3 }}>
                    <ForgotPasswordForm onBack={() => setForgotMode(false)} />
                  </motion.div>
                ) : (
                  <motion.div key="login"
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
                    transition={{ duration: 0.3 }}>

                    {/* Login Header */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center mb-8">
                      {/* Logo icon */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 150, damping: 14 }}
                        className="relative mx-auto mb-5 hidden lg:block"
                      >
                        {/* Pulse ring */}
                        <motion.div
                          className="absolute inset-0 w-18 h-18 rounded-2xl mx-auto"
                          style={{ border: `2px solid ${BRAND.teal}20` }}
                          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        />
                        <div className="w-18 h-18 rounded-2xl flex items-center justify-center mx-auto relative overflow-hidden"
                          style={{ background: BRAND.gradientHero, boxShadow: `0 12px 30px -8px ${BRAND.teal}40`, width: 72, height: 72 }}>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
                          <img src={logoSrc} alt={sysName} className="h-11 w-11 object-contain relative z-10 drop-shadow-md" />
                        </div>
                      </motion.div>

                      <h2 className="text-2xl font-extrabold" style={{ color: '#1a2b3c' }}>
                        {isRTL ? 'مرحباً بعودتك' : 'Welcome Back'}
                      </h2>
                      <p className="text-sm mt-1.5" style={{ color: '#8899aa' }}>
                        {isRTL ? 'سجّل دخولك للوصول إلى لوحة التحكم' : 'Sign in to access your dashboard'}
                      </p>
                    </motion.div>

                    <LoginForm onForgot={() => setForgotMode(true)} />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                className="text-center text-[11px] mt-7 leading-relaxed" style={{ color: '#aabbcc' }}>
                {isRTL ? 'للحصول على حساب جديد، تواصل مع مسؤول النظام' : 'To get a new account, contact your system administrator'}
              </motion.p>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="text-center mt-6 space-y-2">
            <p className="text-[11px]" style={{ color: '#bbccdd' }}>
              © {new Date().getFullYear()} {sysName} — {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
            </p>
            <p className="text-[10px] font-medium tracking-wide" style={{ color: BRAND.teal }}>
              {isRTL ? 'المتعة الحقيقية للتعلم الذكي' : 'True Joy of Smart Learning'}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
