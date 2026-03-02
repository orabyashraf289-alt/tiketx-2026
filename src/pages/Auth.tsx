import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoImg from '@/assets/logo.png';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <img src={logoImg} alt="TicketFlow" className="h-16 w-16 mx-auto mb-4 rounded-2xl" />
          <h1 className="text-2xl font-bold">TicketFlow</h1>
          <p className="text-muted-foreground mt-1">نظام إدارة التذاكر والدعم الفني</p>
        </div>

        <Card>
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
                    <Input id="login-email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="email@example.com" required dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">كلمة المرور</Label>
                    <Input id="login-password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" required dir="ltr" />
                  </div>
                  <Button type="submit" className="w-full gradient-accent text-accent-foreground" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                    تسجيل الدخول
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">الاسم الكامل</Label>
                    <Input id="reg-name" value={regName} onChange={e => setRegName(e.target.value)} placeholder="أحمد محمد" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">البريد الإلكتروني</Label>
                    <Input id="reg-email" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="email@example.com" required dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">كلمة المرور</Label>
                    <Input id="reg-password" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="6 أحرف على الأقل" required dir="ltr" minLength={6} />
                  </div>
                  <Button type="submit" className="w-full gradient-accent text-accent-foreground" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                    إنشاء حساب
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
