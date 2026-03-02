import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ShieldCheck, Zap, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoImg from '@/assets/logo.png';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(regEmail, regPassword, regName);
      toast({ title: 'تم إنشاء الحساب', description: 'يرجى تأكيد البريد الإلكتروني' });
    } catch (err: any) {
      toast({ title: 'خطأ في التسجيل', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background gradient + animated shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(252,56%,52%)] via-[hsl(234,45%,30%)] to-[hsl(216,72%,20%)]" />
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[hsl(216,72%,52%/0.15)] blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[hsl(252,56%,52%/0.2)] blur-3xl animate-[pulse_8s_ease-in-out_infinite_1s]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-[hsl(216,72%,56%/0.1)] blur-2xl animate-[pulse_5s_ease-in-out_infinite_2s]" />
      </div>
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Left side - branding (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative z-10 text-white px-12">
        <div className="max-w-md space-y-8 animate-fade-in">
          <img src={logoImg} alt="TicketFlow" className="h-20 w-20 rounded-2xl shadow-2xl" />
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-3">TicketFlow</h1>
            <p className="text-lg text-white/70 leading-relaxed">
              نظام متكامل لإدارة التذاكر والدعم الفني. تتبّع، أدِر، وحلّ المشكلات بكفاءة عالية.
            </p>
          </div>
          <div className="space-y-4 pt-4">
            {[
              { icon: Zap, text: 'إدارة ذكية للتذاكر مع SLA تلقائي' },
              { icon: ShieldCheck, text: 'نظام أدوار وصلاحيات متقدم' },
              { icon: BarChart3, text: 'تقارير وإحصائيات لحظية' },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-white/80 animate-fade-in"
                style={{ animationDelay: `${300 + i * 150}ms`, animationFillMode: 'both' }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm shrink-0">
                  <feature.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden animate-fade-in">
            <img src={logoImg} alt="TicketFlow" className="h-16 w-16 mx-auto mb-4 rounded-2xl shadow-xl" />
            <h1 className="text-2xl font-bold text-white">TicketFlow</h1>
            <p className="text-white/60 mt-1 text-sm">نظام إدارة التذاكر والدعم الفني</p>
          </div>

          <Card className="shadow-2xl border-0 backdrop-blur-sm bg-card/95 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <Tabs defaultValue="login" dir="rtl">
              <CardHeader className="pb-2">
                <TabsList className="w-full">
                  <TabsTrigger value="login" className="flex-1">تسجيل الدخول</TabsTrigger>
                  <TabsTrigger value="register" className="flex-1">حساب جديد</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">البريد الإلكتروني</Label>
                      <Input id="login-email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="email@example.com" required dir="ltr" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">كلمة المرور</Label>
                      <Input id="login-password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" required dir="ltr" className="h-11" />
                    </div>
                    <Button type="submit" className="w-full h-11 gradient-accent text-accent-foreground font-semibold text-sm transition-transform hover:scale-[1.02] active:scale-[0.98]" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                      تسجيل الدخول
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">الاسم الكامل</Label>
                      <Input id="reg-name" value={regName} onChange={e => setRegName(e.target.value)} placeholder="أحمد محمد" required className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">البريد الإلكتروني</Label>
                      <Input id="reg-email" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="email@example.com" required dir="ltr" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">كلمة المرور</Label>
                      <Input id="reg-password" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="6 أحرف على الأقل" required dir="ltr" minLength={6} className="h-11" />
                    </div>
                    <Button type="submit" className="w-full h-11 gradient-accent text-accent-foreground font-semibold text-sm transition-transform hover:scale-[1.02] active:scale-[0.98]" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                      إنشاء حساب
                    </Button>
                  </form>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          <p className="text-center text-white/40 text-xs mt-6 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
            © {new Date().getFullYear()} TicketFlow. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </div>
  );
}
