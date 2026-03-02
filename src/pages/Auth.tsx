import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, Zap, BarChart3, Ticket, CheckCircle2, Lock, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoImg from '@/assets/logo.png';
import { motion } from 'framer-motion';

const features = [
  { icon: Zap, title: 'إدارة ذكية', desc: 'تتبّع التذاكر مع SLA تلقائي وتصعيد آلي' },
  { icon: ShieldCheck, title: 'أمان متقدم', desc: 'نظام أدوار وصلاحيات دقيق لكل مستوى' },
  { icon: BarChart3, title: 'تقارير لحظية', desc: 'إحصائيات ورسوم بيانية محدّثة باستمرار' },
];

const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  duration: Math.random() * 15 + 10,
  delay: Math.random() * 5,
}));

const floatingTickets = [
  { top: '10%', left: '5%', size: 44, delay: 0, duration: 20 },
  { top: '60%', left: '12%', size: 34, delay: 2, duration: 24 },
  { top: '25%', left: '80%', size: 38, delay: 1, duration: 18 },
  { top: '75%', left: '72%', size: 30, delay: 3, duration: 22 },
  { top: '42%', left: '45%', size: 26, delay: 4, duration: 26 },
  { top: '88%', left: '35%', size: 20, delay: 5, duration: 16 },
];

export default function AuthPage() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    <div className="min-h-screen flex relative overflow-hidden bg-[hsl(158,35%,6%)]">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,hsl(152,55%,20%),transparent_60%)]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_50%,hsl(160,60%,15%),transparent_60%)]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_10%_80%,hsl(152,55%,12%),transparent_50%)]"
        />
      </div>

      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, opacity: 0.03 }}
          animate={{
            y: [0, -40, 0, 30, 0],
            x: [0, 20, -15, 10, 0],
            opacity: [0.03, 0.08, 0.03],
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}

      {/* Floating ticket icons */}
      {floatingTickets.map((t, i) => (
        <motion.div
          key={i}
          className="absolute text-white/[0.04]"
          style={{ top: t.top, left: t.left }}
          animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, -10, 5, 0],
            rotate: [0, 8, -5, 3, 0],
          }}
          transition={{ duration: t.duration, repeat: Infinity, delay: t.delay, ease: 'easeInOut' }}
        >
          <Ticket size={t.size} />
        </motion.div>
      ))}

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(hsl(152,55%,50%) 1px, transparent 1px), linear-gradient(90deg, hsl(152,55%,50%) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Animated line decoration */}
      <motion.div
        className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-[hsl(152,55%,38%/0.15)] to-transparent hidden lg:block"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />

      {/* Left branding panel */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative z-10 px-16">
        <div className="max-w-lg space-y-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
            className="flex items-center gap-4"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-2xl bg-[hsl(152,55%,38%)] blur-xl"
              />
              <img src={logoImg} alt="TicketFlow" className="h-16 w-16 rounded-2xl relative z-10 shadow-lg" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">TicketFlow</h1>
              <p className="text-sm text-white/40 mt-0.5">نظام إدارة الطلبات</p>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg text-white/50 leading-relaxed"
          >
            منصة متكاملة لإدارة الدعم الفني. تتبّع، أدِر، وحلّ المشكلات بسرعة وكفاءة عالية.
          </motion.p>

          <div className="space-y-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
                whileHover={{ x: 8 }}
                className="flex items-start gap-4 group cursor-default"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm shrink-0 group-hover:bg-[hsl(152,55%,38%/0.15)] group-hover:border-[hsl(152,55%,38%/0.3)] transition-all duration-300"
                >
                  <f.icon className="h-5 w-5 text-[hsl(152,55%,50%)]" />
                </motion.div>
                <div>
                  <h3 className="text-sm font-bold text-white/90">{f.title}</h3>
                  <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="flex items-center gap-6 pt-6 border-t border-white/[0.06]"
          >
            {['تشفير شامل', 'دعم 24/7', 'SLA مضمون'].map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + i * 0.1 }}
                className="flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(152,55%,50%)]" />
                <span className="text-xs text-white/35">{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
          className="w-full max-w-[420px]"
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
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-2xl bg-[hsl(152,55%,38%)] blur-xl"
              />
              <img src={logoImg} alt="TicketFlow" className="h-14 w-14 mx-auto rounded-2xl relative z-10" />
            </div>
            <h1 className="text-xl font-bold text-white mt-3">TicketFlow</h1>
            <p className="text-white/40 mt-1 text-xs">نظام إدارة الطلبات والدعم الفني</p>
          </motion.div>

          {/* Glass card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            className="rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden"
          >
            {/* Card header with glow */}
            <div className="relative px-6 pt-8 pb-4">
              <motion.div
                animate={{ opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-[hsl(152,55%,50%)]"
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4, type: 'spring', stiffness: 200 }}
                className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[hsl(152,55%,30%/0.3)]"
              >
                <Lock className="h-6 w-6 text-white" />
              </motion.div>
              <h2 className="text-xl font-bold text-white text-center">تسجيل الدخول</h2>
              <p className="text-xs text-white/40 text-center mt-1">أدخل بياناتك للوصول إلى النظام</p>
            </div>

            <form onSubmit={handleLogin} className="px-6 pb-6 space-y-4">
              {/* Email */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <Label htmlFor="login-email" className="text-white/60 text-xs flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  البريد الإلكتروني
                </Label>
                <div className="relative">
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="email@example.com"
                    required
                    dir="ltr"
                    className="h-12 bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-[hsl(152,55%,38%)] focus-visible:border-[hsl(152,55%,30%)] rounded-xl transition-all duration-300"
                  />
                  <motion.div
                    animate={{ opacity: focusedField === 'email' ? 1 : 0, scaleX: focusedField === 'email' ? 1 : 0 }}
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[hsl(152,55%,50%)] to-transparent"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <Label htmlFor="login-password" className="text-white/60 text-xs flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    required
                    dir="ltr"
                    className="h-12 bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-[hsl(152,55%,38%)] focus-visible:border-[hsl(152,55%,30%)] rounded-xl transition-all duration-300"
                  />
                  <motion.div
                    animate={{ opacity: focusedField === 'password' ? 1 : 0, scaleX: focusedField === 'password' ? 1 : 0 }}
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[hsl(152,55%,50%)] to-transparent"
                  />
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.4 }}
              >
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl font-semibold text-sm text-white gradient-primary hover:opacity-90 shadow-lg shadow-[hsl(152,55%,25%/0.4)] transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                    تسجيل الدخول
                  </Button>
                </motion.div>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="px-6 pb-6"
            >
              <p className="text-center text-white/25 text-xs">
                للحصول على حساب، تواصل مع مسؤول النظام
              </p>
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-white/15 text-xs mt-6"
          >
            © {new Date().getFullYear()} TicketFlow. جميع الحقوق محفوظة.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
