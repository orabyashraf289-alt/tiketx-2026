import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, Zap, BarChart3, Ticket, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoImg from '@/assets/logo.png';
import { motion } from 'framer-motion';

const features = [
  { icon: Zap, title: 'إدارة ذكية', desc: 'تتبّع التذاكر مع SLA تلقائي وتصعيد آلي' },
  { icon: ShieldCheck, title: 'أمان متقدم', desc: 'نظام أدوار وصلاحيات دقيق لكل مستوى' },
  { icon: BarChart3, title: 'تقارير لحظية', desc: 'إحصائيات ورسوم بيانية محدّثة باستمرار' },
];

const floatingTickets = [
  { top: '12%', left: '8%', size: 40, delay: 0, duration: 18 },
  { top: '65%', left: '15%', size: 32, delay: 3, duration: 22 },
  { top: '30%', left: '75%', size: 36, delay: 1.5, duration: 20 },
  { top: '78%', left: '70%', size: 28, delay: 4, duration: 16 },
  { top: '45%', left: '50%', size: 24, delay: 2, duration: 24 },
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
    <div className="min-h-screen flex relative overflow-hidden bg-[hsl(230,30%,6%)]">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,hsl(252,56%,28%),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_50%,hsl(216,72%,20%),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_10%_80%,hsl(252,56%,18%),transparent_50%)]" />
      </div>

      {/* Animated floating ticket icons */}
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
          transition={{
            duration: t.duration,
            repeat: Infinity,
            delay: t.delay,
            ease: 'easeInOut',
          }}
        >
          <Ticket size={t.size} />
        </motion.div>
      ))}

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(hsl(0,0%,100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0,0%,100%) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Left branding panel */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative z-10 px-16">
        <div className="max-w-lg space-y-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-4"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-[hsl(252,56%,52%)] blur-xl opacity-40" />
              <img src={logoImg} alt="TicketFlow" className="h-16 w-16 rounded-2xl relative z-10" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">TicketFlow</h1>
              <p className="text-sm text-white/40 mt-0.5">نظام إدارة التذاكر</p>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
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
                transition={{ delay: 0.4 + i * 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-4 group"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm shrink-0 group-hover:bg-white/[0.1] transition-colors duration-300">
                  <f.icon className="h-5 w-5 text-[hsl(216,72%,60%)]" />
                </div>
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
            transition={{ delay: 1, duration: 0.8 }}
            className="flex items-center gap-6 pt-6 border-t border-white/[0.06]"
          >
            {['تشفير شامل', 'دعم 24/7', 'SLA مضمون'].map((text, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(152,55%,50%)]" />
                <span className="text-xs text-white/35">{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right form panel - Login Only */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
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
              <div className="absolute inset-0 rounded-2xl bg-[hsl(252,56%,52%)] blur-xl opacity-30" />
              <img src={logoImg} alt="TicketFlow" className="h-14 w-14 mx-auto rounded-2xl relative z-10" />
            </div>
            <h1 className="text-xl font-bold text-white mt-3">TicketFlow</h1>
            <p className="text-white/40 mt-1 text-xs">نظام إدارة التذاكر والدعم الفني</p>
          </motion.div>

          {/* Glass card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden p-6">
            <h2 className="text-lg font-bold text-white mb-6 text-center">تسجيل الدخول</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-white/60 text-xs">البريد الإلكتروني</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  dir="ltr"
                  className="h-11 bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 focus-visible:ring-[hsl(252,56%,52%)] focus-visible:border-[hsl(252,56%,40%)] rounded-xl transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-white/60 text-xs">كلمة المرور</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  dir="ltr"
                  className="h-11 bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 focus-visible:ring-[hsl(252,56%,52%)] focus-visible:border-[hsl(252,56%,40%)] rounded-xl transition-colors"
                />
              </div>
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-semibold text-sm text-white bg-gradient-to-l from-[hsl(252,56%,52%)] to-[hsl(216,72%,52%)] hover:from-[hsl(252,56%,58%)] hover:to-[hsl(216,72%,58%)] shadow-lg shadow-[hsl(252,56%,30%/0.3)] transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                  تسجيل الدخول
                </Button>
              </motion.div>
            </form>

            <p className="text-center text-white/30 text-xs mt-4">
              للحصول على حساب، تواصل مع مسؤول النظام
            </p>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-white/20 text-xs mt-6"
          >
            © {new Date().getFullYear()} TicketFlow. جميع الحقوق محفوظة.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
