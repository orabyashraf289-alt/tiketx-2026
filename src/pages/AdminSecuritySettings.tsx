import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { useToast } from '@/hooks/use-toast';
import { sanitizeError } from '@/lib/errorHandler';
import { motion } from 'framer-motion';
import { KeyRound, Shield, Mail, Send, Loader2, Users, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AdminSecuritySettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Password policy state
  const [minLength, setMinLength] = useState('8');
  const [requireUppercase, setRequireUppercase] = useState(true);
  const [requireNumbers, setRequireNumbers] = useState(true);
  const [requireSpecial, setRequireSpecial] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('480');
  const [policySaving, setPolicySaving] = useState(false);

  // Broadcast email state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailTarget, setEmailTarget] = useState('all');
  const [sending, setSending] = useState(false);

  // Load settings
  const { data: settings = [] } = useQuery({
    queryKey: ['security-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('*')
        .in('key', ['password_min_length', 'password_require_uppercase', 'password_require_numbers', 'password_require_special', 'session_timeout_minutes']);
      return data || [];
    },
    meta: {
      onSuccess: (data: any[]) => {
        data.forEach((s: any) => {
          if (s.key === 'password_min_length') setMinLength(s.value || '8');
          if (s.key === 'password_require_uppercase') setRequireUppercase(s.value === 'true');
          if (s.key === 'password_require_numbers') setRequireNumbers(s.value === 'true');
          if (s.key === 'password_require_special') setRequireSpecial(s.value === 'true');
          if (s.key === 'session_timeout_minutes') setSessionTimeout(s.value || '480');
        });
      }
    }
  });

  // Apply loaded settings
  useState(() => {
    settings.forEach((s: any) => {
      if (s.key === 'password_min_length') setMinLength(s.value || '8');
      if (s.key === 'password_require_uppercase') setRequireUppercase(s.value === 'true');
      if (s.key === 'password_require_numbers') setRequireNumbers(s.value === 'true');
      if (s.key === 'password_require_special') setRequireSpecial(s.value === 'true');
      if (s.key === 'session_timeout_minutes') setSessionTimeout(s.value || '480');
    });
  });

  const savePasswordPolicy = async () => {
    setPolicySaving(true);
    try {
      const entries = [
        { key: 'password_min_length', value: minLength },
        { key: 'password_require_uppercase', value: String(requireUppercase) },
        { key: 'password_require_numbers', value: String(requireNumbers) },
        { key: 'password_require_special', value: String(requireSpecial) },
        { key: 'session_timeout_minutes', value: sessionTimeout },
      ];
      for (const entry of entries) {
        const { data: existing } = await supabase
          .from('system_settings')
          .select('id')
          .eq('key', entry.key)
          .single();
        if (existing) {
          await supabase.from('system_settings').update({ value: entry.value }).eq('key', entry.key);
        } else {
          await supabase.from('system_settings').insert(entry);
        }
      }
      toast({ title: 'تم حفظ سياسة كلمات المرور ✅' });
      queryClient.invalidateQueries({ queryKey: ['security-settings'] });
    } catch (err: any) {
      toast({ title: 'خطأ', description: sanitizeError(err), variant: 'destructive' });
    } finally {
      setPolicySaving(false);
    }
  };

  const sendBroadcastEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast({ title: 'يرجى تعبئة الموضوع والمحتوى', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const res = await supabase.functions.invoke('broadcast-email', {
        body: { subject: emailSubject.trim(), body: emailBody.trim(), target: emailTarget },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast({ title: `تم إرسال الإشعار بنجاح ✅`, description: `تم الإرسال إلى ${res.data?.sent_count || 0} مستخدم` });
      setEmailSubject('');
      setEmailBody('');
    } catch (err: any) {
      toast({ title: 'خطأ في الإرسال', description: sanitizeError(err), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <motion.header
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 gap-3 shrink-0 sticky top-0 z-30"
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">إعدادات الأمان والإشعارات</h1>
            </div>
            <NotificationsPopover />
          </motion.header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-3xl mx-auto">
              <Tabs defaultValue="password" dir="rtl">
                <TabsList className="mb-6 w-full justify-start">
                  <TabsTrigger value="password" className="gap-2"><KeyRound className="h-4 w-4" />سياسة كلمات المرور</TabsTrigger>
                  <TabsTrigger value="broadcast" className="gap-2"><Mail className="h-4 w-4" />إرسال إشعار جماعي</TabsTrigger>
                </TabsList>

                <TabsContent value="password">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" />سياسة كلمات المرور</CardTitle>
                        <CardDescription>تحكم في متطلبات كلمات المرور للمستخدمين الجدد</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>الحد الأدنى لطول كلمة المرور</Label>
                            <Input type="number" min="6" max="32" value={minLength} onChange={e => setMinLength(e.target.value)} />
                            <p className="text-xs text-muted-foreground">الحد الأدنى المسموح: 6 أحرف</p>
                          </div>
                          <div className="space-y-2">
                            <Label>مهلة انتهاء الجلسة (بالدقائق)</Label>
                            <Input type="number" min="30" value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} />
                            <p className="text-xs text-muted-foreground">480 دقيقة = 8 ساعات</p>
                          </div>
                        </div>

                        <div className="space-y-4 border rounded-xl p-4 bg-muted/30">
                          <h3 className="font-semibold text-sm text-foreground">متطلبات التعقيد</h3>
                          <div className="flex items-center justify-between">
                            <Label>أحرف كبيرة (A-Z)</Label>
                            <Switch checked={requireUppercase} onCheckedChange={setRequireUppercase} />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>أرقام (0-9)</Label>
                            <Switch checked={requireNumbers} onCheckedChange={setRequireNumbers} />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>رموز خاصة (!@#$%)</Label>
                            <Switch checked={requireSpecial} onCheckedChange={setRequireSpecial} />
                          </div>
                        </div>

                        <div className="border rounded-xl p-4 bg-muted/20">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                            <div className="text-xs text-muted-foreground">
                              <p className="font-medium text-foreground mb-1">ملاحظة مهمة</p>
                              <p>هذه الإعدادات تُطبق على نموذج إنشاء المستخدمين في النظام. يتم التحقق من متطلبات كلمة المرور عند إنشاء حسابات جديدة.</p>
                            </div>
                          </div>
                        </div>

                        <Button onClick={savePasswordPolicy} disabled={policySaving} className="w-full">
                          {policySaving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                          حفظ سياسة كلمات المرور
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="broadcast">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />إرسال إشعار جماعي بالبريد</CardTitle>
                        <CardDescription>أرسل بريداً إلكترونياً لجميع المستخدمين أو فئة محددة لإبلاغهم بالتحديثات</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>الفئة المستهدفة</Label>
                          <Select value={emailTarget} onValueChange={setEmailTarget}>
                            <SelectTrigger>
                              <Users className="h-4 w-4 ml-2" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">جميع المستخدمين</SelectItem>
                              <SelectItem value="admin">المشرفين فقط</SelectItem>
                              <SelectItem value="agent">الدعم الفني فقط</SelectItem>
                              <SelectItem value="developer">المطورين فقط</SelectItem>
                              <SelectItem value="requester">العملاء فقط</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>موضوع البريد *</Label>
                          <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="مثال: تحديث مهم على النظام" maxLength={200} />
                        </div>

                        <div className="space-y-2">
                          <Label>محتوى الرسالة *</Label>
                          <Textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder="اكتب محتوى الرسالة هنا..." rows={6} maxLength={5000} />
                          <p className="text-xs text-muted-foreground">{emailBody.length}/5000 حرف</p>
                        </div>

                        <div className="border rounded-xl p-4 bg-muted/20">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground">سيتم إرسال البريد لجميع المستخدمين النشطين في الفئة المحددة. تأكد من مراجعة المحتوى قبل الإرسال.</p>
                          </div>
                        </div>

                        <Button onClick={sendBroadcastEmail} disabled={sending || !emailSubject.trim() || !emailBody.trim()} className="w-full gap-2">
                          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          إرسال الإشعار
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
