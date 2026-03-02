import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, Zap, BarChart3, CheckCircle2, Lock, Mail, ArrowLeft, Layers, Clock, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoImg from '@/assets/logo.png';
import { motion } from 'framer-motion';

const features = [
  { icon: Layers, title: 'إدارة مركزية', desc: 'نقطة واحدة لجميع الطلبات والتذاكر مع تصنيف تلقائي' },
  { icon: Clock, title: 'استجابة فورية', desc: 'مستويات SLA ذكية مع تصعيد آلي وإشعارات لحظية' },
  { icon: ShieldCheck, title: 'حماية متقدمة', desc: 'صلاحيات دقيقة ومراحل اعتماد متعددة لكل قسم' },
  { icon: BarChart3, title: 'تقارير تفاعلية', desc: 'لوحة تحكم شاملة مع رسوم بيانية وتصدير للطباعة' },
];

const orbs = [
  { cx: '15%', cy: '20%', r: 180, color: 'hsl(152,60%,30%)', duration: 20, delay: 0 },
  { cx: '85%', cy: '70%', r: 200, color: 'hsl(160,55%,25%)', duration: 25, delay: 3 },
  { cx: '50%', cy: '90%', r: 150, color: 'hsl(145,50%,20%)', duration: 18, delay: 6 },
  { cx: '70%', cy: '15%', r: 120, color: 'hsl(170,60%,22%)', duration: 22, delay: 2 },
];

export default function AuthPage() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

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

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'hsl(155,30%,4%)' }}>
      {/* Animated orbs */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {orbs.map((orb, i) => (
          <motion.circle
            key={i}
            cx={orb.cx}
            cy={orb.cy}
            r={orb.r}
            fill={orb.color}
            opacity={0.15}
            filter="url(#blur)"
            animate={{
              cx: [orb.cx, `${parseFloat(orb.cx) + 10}%`, `${parseFloat(orb.cx) - 5}%`, orb.cx],
              cy: [orb.cy, `${parseFloat(orb.cy) - 8}%`, `${parseFloat(orb.cy) + 5}%`, orb.cy],
            }}
            transition={{ duration: orb.duration, repeat: Infinity, ease: 'easeInOut', delay: orb.delay }}
          />
        ))}
        <defs>
          <filter id="blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="60" />
          </filter>
        </defs>
      </svg>

      {/* Noise overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center relative z-10 px-12 xl:px-20">
        <div className="max-w-xl">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
            className="flex items-center gap-4 mb-10"
          >
            <motion.div
              className="relative"
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.15, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-2 rounded-2xl bg-[hsl(152,55%,38%)] blur-2xl"
              />
              <img src={logoImg} alt="TicketFlow" className="h-14 w-14 rounded-2xl relative z-10 ring-1 ring-white/10" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">TicketFlow</h1>
              <p className="text-xs text-[hsl(152,55%,50%)] font-medium tracking-wide">SMART HELPDESK PLATFORM</p>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
            className="mb-10"
          >
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
              أدِر طلباتك
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-[hsl(152,55%,55%)] to-[hsl(170,60%,45%)]">
                بذكاء وكفاءة
              </span>
            </h2>
            <p className="text-base text-white/45 leading-relaxed max-w-md">
              منصة متكاملة تجمع بين سهولة الاستخدام وقوة الأداء. 
              من تقديم الطلب حتى إغلاقه — كل شيء تحت السيطرة.
            </p>
          </motion.div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
                whileHover={{ y: -3, backgroundColor: 'rgba(255,255,255,0.06)' }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 cursor-default"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[hsl(152,55%,38%)] to-[hsl(170,60%,35%)] flex items-center justify-center shadow-md shadow-[hsl(152,55%,20%/0.3)]">
                    <f.icon className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white/90">{f.title}</h3>
                </div>
                <p className="text-xs text-white/35 leading-relaxed pr-12">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex items-center gap-5"
          >
            {[
              { icon: ShieldCheck, text: 'تشفير كامل' },
              { icon: Zap, text: 'أداء عالي' },
              { icon: Users, text: 'متعدد المستخدمين' },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <badge.icon className="h-3.5 w-3.5 text-[hsl(152,55%,45%)]" />
                <span className="text-[11px] text-white/30 font-medium">{badge.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-5 sm:p-8">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 lg:hidden"
          >
            <div className="relative inline-block">
              <motion.div
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-2 rounded-2xl bg-[hsl(152,55%,38%)] blur-xl"
              />
              <img src={logoImg} alt="TicketFlow" className="h-12 w-12 mx-auto rounded-2xl relative z-10" />
            </div>
            <h1 className="text-lg font-bold text-white mt-3">TicketFlow</h1>
            <p className="text-white/35 mt-1 text-xs">منصة إدارة الطلبات الذكية</p>
          </motion.div>

          {/* Login card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
            className="rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-2xl shadow-2xl shadow-black/40"
          >
            {/* Top accent */}
            <div className="h-1 rounded-t-3xl bg-gradient-to-l from-[hsl(152,55%,38%)] via-[hsl(160,60%,42%)] to-[hsl(170,60%,35%)]" />

            <div className="p-7">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-7"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(152,55%,38%)] to-[hsl(170,60%,35%)] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[hsl(152,55%,20%/0.4)]"
                >
                  <Lock className="h-6 w-6 text-white" />
                </motion.div>
                <h2 className="text-xl font-bold text-white">مرحباً بعودتك</h2>
                <p className="text-xs text-white/35 mt-1">سجّل دخولك للوصول إلى لوحة التحكم</p>
              </motion.div>

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email field */}
                <motion.div
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45, duration: 0.5 }}
                  className="space-y-2"
                >
                  <Label htmlFor="email" className="text-white/50 text-xs font-medium flex items-center gap-1.5">
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
                    className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 focus-visible:ring-[hsl(152,55%,38%/0.5)] focus-visible:border-[hsl(152,55%,38%/0.4)] rounded-xl transition-all duration-300 text-sm"
                  />
                </motion.div>

                {/* Password field */}
                <motion.div
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55, duration: 0.5 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password" className="text-white/50 text-xs font-medium flex items-center gap-1.5">
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
                    className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 focus-visible:ring-[hsl(152,55%,38%/0.5)] focus-visible:border-[hsl(152,55%,38%/0.4)] rounded-xl transition-all duration-300 text-sm"
                  />
                </motion.div>

                {/* Submit */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                >
                  <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 rounded-xl font-bold text-sm text-white bg-gradient-to-l from-[hsl(152,55%,38%)] to-[hsl(170,60%,35%)] hover:from-[hsl(152,55%,42%)] hover:to-[hsl(170,60%,40%)] shadow-lg shadow-[hsl(152,55%,20%/0.4)] transition-all duration-300 gap-2"
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

              {/* Footer */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-center text-white/20 text-[11px] mt-6"
              >
                للحصول على حساب جديد، تواصل مع مسؤول النظام
              </motion.p>
            </div>
          </motion.div>

          {/* Copyright */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-center text-white/10 text-[11px] mt-6"
          >
            © {new Date().getFullYear()} TicketFlow — جميع الحقوق محفوظة
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
