import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, Lock, Mail, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sanitizeError } from '@/lib/errorHandler';
import logoImg from '@/assets/logo-icon.png';
import authBg from '@/assets/auth-bg.jpg';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

/* ─── Left Branding Panel ─── */
const BrandingPanel = ({ sysName, sysSub, logoSrc }: { sysName: string; sysSub: string; logoSrc: string }) => {
  const { t } = useLanguage();

  return (
    <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0a1e5e 0%, #1a3faa 40%, #2563eb 70%, #3b82f6 100%)' }}>

      {/* Background Image */}
      <img src={authBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-soft-light" />

      {/* Animated wave overlays */}
      <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1440 400" preserveAspectRatio="none" style={{ height: '50%' }}>
        <motion.path
          fill="hsl(0 0% 100% / 0.06)"
          animate={{
            d: [
              "M0,250 C200,180 400,320 600,250 C800,180 1000,320 1200,250 C1320,210 1380,230 1440,220 L1440,400 L0,400 Z",
              "M0,220 C200,300 400,180 600,280 C800,320 1000,200 1200,280 C1320,320 1380,260 1440,250 L1440,400 L0,400 Z",
              "M0,250 C200,180 400,320 600,250 C800,180 1000,320 1200,250 C1320,210 1380,230 1440,220 L1440,400 L0,400 Z",
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          fill="hsl(0 0% 100% / 0.04)"
          animate={{
            d: [
              "M0,300 C300,230 600,350 900,280 C1100,230 1300,300 1440,260 L1440,400 L0,400 Z",
              "M0,260 C300,340 600,220 900,300 C1100,350 1300,250 1440,290 L1440,400 L0,400 Z",
              "M0,300 C300,230 600,350 900,280 C1100,230 1300,300 1440,260 L1440,400 L0,400 Z",
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />
      </svg>

      {/* Floating soft circles */}
      {[
        { size: 300, top: '-8%', right: '-5%', opacity: 0.06, delay: 0 },
        { size: 200, bottom: '20%', left: '-3%', opacity: 0.05, delay: 2 },
        { size: 150, top: '40%', right: '15%', opacity: 0.04, delay: 4 },
      ].map((c, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: c.size, height: c.size,
            background: `radial-gradient(circle, hsl(0 0% 100% / ${c.opacity}), transparent 70%)`,
            top: c.top, right: c.right, bottom: (c as any).bottom, left: (c as any).left,
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: c.delay }}
        />
      ))}

      {/* Content - centered logo + text */}
      <div className="relative z-10 text-center px-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo */}
          <motion.div
            className="w-28 h-28 mx-auto mb-8 relative"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="absolute inset-0 rounded-3xl bg-white/10 backdrop-blur-sm" />
            <div className="relative w-full h-full rounded-3xl flex items-center justify-center overflow-hidden"
              style={{ boxShadow: '0 20px 50px -15px rgba(0,0,0,0.3)' }}>
              <img src={logoSrc} alt={sysName} className="h-20 w-20 object-contain drop-shadow-xl relative z-10" />
            </div>
          </motion.div>

          {/* System Name */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-extrabold text-white tracking-tight mb-3"
          >
            {sysName}
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-white/60 text-sm font-medium tracking-wide"
          >
            {sysSub === 'SMART HELPDESK'
              ? (t.auth?.heroTitle2 || 'Solutions, Delivered Smoothly')
              : sysSub}
          </motion.p>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="w-16 h-[2px] bg-white/20 mx-auto mt-6 rounded-full"
          />
        </motion.div>
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
  const [rememberMe, setRememberMe] = useState(false);

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

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      {/* Email */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-2">
        <Label htmlFor="login-email" className="text-sm font-medium text-[#374151] flex items-center gap-2">
          <Mail className="h-4 w-4 text-[#9ca3af]" />
          {t.auth.email}
        </Label>
        <Input
          id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email address'}
          required dir="ltr"
          className="h-12 rounded-xl bg-[#f9fafb] border-[#e5e7eb] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 focus:bg-white transition-all duration-200"
        />
      </motion.div>

      {/* Password */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="space-y-2">
        <Label htmlFor="login-password" className="text-sm font-medium text-[#374151] flex items-center gap-2">
          <Lock className="h-4 w-4 text-[#9ca3af]" />
          {t.auth.password}
        </Label>
        <div className="relative">
          <Input
            id="login-password" type={showPassword ? 'text' : 'password'} value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required dir="ltr"
            className="h-12 rounded-xl bg-[#f9fafb] border-[#e5e7eb] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 focus:bg-white transition-all duration-200 ltr:pr-11 rtl:pl-11"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute ltr:right-3.5 rtl:left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280] transition-colors">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>

      {/* Remember me + Forgot password */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <div
            onClick={() => setRememberMe(!rememberMe)}
            className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${
              rememberMe ? 'bg-[#2563eb] border-[#2563eb]' : 'border-[#d1d5db] group-hover:border-[#9ca3af]'
            }`}
            style={{ width: 18, height: 18 }}
          >
            {rememberMe && (
              <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </motion.svg>
            )}
          </div>
          <span className="text-sm text-[#6b7280]">{isRTL ? 'تذكرني' : 'Remember me'}</span>
        </label>
        <button type="button" onClick={onForgot} className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors">
          {t.auth.forgotPassword}
        </button>
      </motion.div>

      {/* Login Button */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button type="submit" disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-sm text-white border-0 gap-2 shadow-lg shadow-[#2563eb]/25 hover:shadow-xl hover:shadow-[#2563eb]/30 transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb, #3b82f6)' }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <span className="flex items-center gap-2">{t.auth.login} <ArrowIcon className="h-4 w-4" /></span>
            )}
          </Button>
        </motion.div>
      </motion.div>

      {/* Divider */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e5e7eb]" /></div>
        <div className="relative flex justify-center">
          <span className="px-4 text-xs font-medium text-[#9ca3af] bg-white">{isRTL ? 'أو تسجيل الدخول بواسطة' : 'Or continue with'}</span>
        </div>
      </motion.div>

      {/* Social Login Buttons */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-3">
        <motion.button
          type="button"
          whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-[#e5e7eb] bg-white hover:bg-[#f9fafb] transition-colors text-sm font-medium text-[#374151]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-[#e5e7eb] bg-white hover:bg-[#f9fafb] transition-colors text-sm font-medium text-[#374151]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M11.4 24H0V12.6L4.8 7.8H0V0h11.4v7.8H7.8l4.8 4.8H24v11.4H12.6l-1.2-1.2zm1.2-1.2H22.8V13.2H13.2l-4.8-4.8h5.4V1.2H1.2v5.4h5.4L1.2 12v10.8h10.2l1.2 1.2z" fill="#F25022" />
            <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
            <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
            <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
            <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
          </svg>
          Microsoft
        </motion.button>
      </motion.div>
    </form>
  );
};

/* ─── Forgot Password ─── */
const ForgotPasswordForm = ({ onBack }: { onBack: () => void }) => {
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
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
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
          <div className="w-16 h-16 rounded-full bg-[#ecfdf5] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-[#10b981]" />
          </div>
        </motion.div>
        <h3 className="text-lg font-bold text-[#111827]">{t.auth.resetSentTitle}</h3>
        <p className="text-sm text-[#6b7280] mt-2 mb-6 max-w-xs mx-auto">{t.auth.resetSentDesc}</p>
        <Button variant="outline" size="sm" onClick={onBack} className="rounded-xl border-[#e5e7eb]">{t.auth.backToLogin}</Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
          <Mail className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-[#111827]">{t.auth.forgotPasswordTitle}</h3>
        <p className="text-xs text-[#6b7280] mt-1">{t.auth.forgotPasswordDesc}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#374151]">{t.auth.email}</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email address'}
            required dir="ltr"
            className="h-12 rounded-xl bg-[#f9fafb] border-[#e5e7eb] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 focus:bg-white transition-all" />
        </div>
        <Button type="submit" disabled={loading}
          className="w-full h-12 rounded-xl font-bold text-sm gap-2 border-0 text-white shadow-lg shadow-[#2563eb]/25"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb, #3b82f6)' }}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.auth.sendResetLink}
        </Button>
      </form>
      <button onClick={onBack} className="text-sm text-[#6b7280] hover:text-[#374151] mt-4 mx-auto block transition-colors">
        ← {t.auth.backToLogin}
      </button>
    </motion.div>
  );
};

/* ─── Main Auth Page ─── */
export default function AuthPage() {
  const sysSettings = useSystemSettings();
  const { t, isRTL } = useLanguage();
  const sysName = sysSettings.system_name || 'Ticket-X';
  const sysSub = sysSettings.system_subtitle || 'SMART HELPDESK';
  const logoSrc = sysSettings.logo_url || logoImg;
  const [forgotMode, setForgotMode] = useState(false);

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel - Blue Branding */}
      <BrandingPanel sysName={sysName} sysSub={sysSub} logoSrc={logoSrc} />

      {/* Right Panel - White Login */}
      <div className="flex-1 flex items-center justify-center relative p-6 sm:p-10 lg:max-w-[560px] bg-white">
        {/* Language switcher */}
        <div className="absolute top-5 ltr:right-5 rtl:left-5 z-20">
          <LanguageSwitcher variant="outline" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Mobile Logo */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-8 lg:hidden">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl shadow-lg overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
              <img src={logoSrc} alt={sysName} className="h-10 w-10 object-contain" />
            </div>
            <h1 className="text-xl font-extrabold text-[#111827] mt-3">{sysName}</h1>
          </motion.div>

          {/* Header */}
          <AnimatePresence mode="wait">
            {!forgotMode && (
              <motion.div
                key="header"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                <h2 className="text-[28px] font-extrabold text-[#111827]">
                  {isRTL ? 'مرحباً بعودتك' : 'Welcome back'}
                </h2>
                <p className="text-[15px] text-[#6b7280] mt-1.5">
                  {isRTL ? 'سجّل دخولك إلى حسابك' : 'Log in to your account.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forms */}
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
                <LoginForm onForgot={() => setForgotMode(true)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="text-center text-[#9ca3af] text-xs mt-8">
            {isRTL ? 'للحصول على حساب جديد، تواصل مع مسؤول النظام' : 'To get a new account, contact your system administrator'}
          </motion.p>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            className="text-center text-[#d1d5db] text-[11px] mt-4">
            © {new Date().getFullYear()} {sysName} — {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
