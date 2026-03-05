import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Camera, Loader2, CheckCircle, Phone, MapPin, Bell, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { roleLabels } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function ProfilePage() {
  const { user, profile, role } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('السعودية');
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Notification preferences
  const [notifyTicketCreated, setNotifyTicketCreated] = useState(true);
  const [notifyTicketAssigned, setNotifyTicketAssigned] = useState(true);
  const [notifyStatusChanged, setNotifyStatusChanged] = useState(true);
  const [notifyCommentAdded, setNotifyCommentAdded] = useState(true);
  const [notifySlaBreach, setNotifySlaBreach] = useState(true);
  const [notifyApproval, setNotifyApproval] = useState(true);
  const [notifyWeeklyReport, setNotifyWeeklyReport] = useState(true);
  const [savingNotifs, setSavingNotifs] = useState(false);

  // Load extended profile
  const { data: extProfile } = useQuery({
    queryKey: ['extended-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (extProfile) {
      setFullName(extProfile.full_name || '');
      setPhone((extProfile as any).phone || '');
      setMobile((extProfile as any).mobile || '');
      setCity((extProfile as any).city || '');
      setCountry((extProfile as any).country || 'السعودية');
      setNotifyTicketCreated((extProfile as any).notify_ticket_created !== false);
      setNotifyTicketAssigned((extProfile as any).notify_ticket_assigned !== false);
      setNotifyStatusChanged((extProfile as any).notify_status_changed !== false);
      setNotifyCommentAdded((extProfile as any).notify_comment_added !== false);
      setNotifySlaBreach((extProfile as any).notify_sla_breach !== false);
      setNotifyApproval((extProfile as any).notify_approval !== false);
      setNotifyWeeklyReport((extProfile as any).notify_weekly_report !== false);
    }
  }, [extProfile]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: fullName,
        phone, mobile, city, country,
      } as any).eq('id', user.id);
      if (error) throw error;
      toast({ title: 'تم تحديث الملف الشخصي بنجاح ✅' });
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleSaveNotifications = async () => {
    if (!user) return;
    setSavingNotifs(true);
    try {
      const { error } = await supabase.from('profiles').update({
        notify_ticket_created: notifyTicketCreated,
        notify_ticket_assigned: notifyTicketAssigned,
        notify_status_changed: notifyStatusChanged,
        notify_comment_added: notifyCommentAdded,
        notify_sla_breach: notifySlaBreach,
        notify_approval: notifyApproval,
        notify_weekly_report: notifyWeeklyReport,
      } as any).eq('id', user.id);
      if (error) throw error;
      toast({ title: 'تم حفظ تفضيلات الإشعارات ✅' });
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    }
    setSavingNotifs(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'كلمة المرور غير متطابقة', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'تم تغيير كلمة المرور بنجاح ✅' });
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast({ title: 'حدث خطأ في تغيير كلمة المرور', variant: 'destructive' });
    }
    setChangingPassword(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('ticket-attachments').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: signedData } = await supabase.storage.from('ticket-attachments').createSignedUrl(path, 60 * 60 * 24 * 365);
      const avatarUrl = signedData?.signedUrl || path;
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
      if (updateError) throw updateError;
      toast({ title: 'تم تحديث الصورة الشخصية ✅' });
      window.location.reload();
    } catch {
      toast({ title: 'حدث خطأ في رفع الصورة', variant: 'destructive' });
    }
    setUploading(false);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 gap-3 shrink-0 sticky top-0 z-30"
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <User className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">الملف الشخصي</h1>
            </div>
            <NotificationsPopover />
          </motion.header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Avatar & Info */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="rounded-2xl">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-5">
                      <div className="relative group">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="gradient-primary text-white text-2xl font-bold">
                            {profile?.full_name?.charAt(0) || 'م'}
                          </AvatarFallback>
                        </Avatar>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          {uploading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                        </label>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">{profile?.full_name}</h2>
                        <p className="text-sm text-muted-foreground">{profile?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {role && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {roleLabels[role]}
                            </span>
                          )}
                          {(extProfile as any)?.employee_number && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                              #{(extProfile as any).employee_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <Tabs defaultValue="info" dir="rtl">
                <TabsList className="mb-4 w-full justify-start">
                  <TabsTrigger value="info" className="gap-2"><User className="h-4 w-4" />المعلومات</TabsTrigger>
                  <TabsTrigger value="contact" className="gap-2"><Phone className="h-4 w-4" />التواصل</TabsTrigger>
                  <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" />الإشعارات</TabsTrigger>
                  <TabsTrigger value="security" className="gap-2"><Lock className="h-4 w-4" />الأمان</TabsTrigger>
                </TabsList>

                {/* Basic Info */}
                <TabsContent value="info">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" />المعلومات الأساسية</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>الاسم الكامل</Label>
                            <Input value={fullName} onChange={e => setFullName(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>البريد الإلكتروني</Label>
                            <Input value={profile?.email || ''} disabled className="bg-muted" dir="ltr" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>المسمى الوظيفي</Label>
                            <Input value={(extProfile as any)?.job_title || ''} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">يتم تعديله بواسطة الأدمن</p>
                          </div>
                          <div className="space-y-2">
                            <Label>رقم الموظف</Label>
                            <Input value={(extProfile as any)?.employee_number || ''} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">يتم تعديله بواسطة الأدمن</p>
                          </div>
                        </div>
                        <Button onClick={handleUpdateProfile} disabled={saving} className="gap-2">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          حفظ التغييرات
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Contact Info */}
                <TabsContent value="contact">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2"><Phone className="h-4 w-4 text-primary" />معلومات التواصل</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>رقم الهاتف</Label>
                            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+966 1x xxx xxxx" dir="ltr" />
                          </div>
                          <div className="space-y-2">
                            <Label>رقم الجوال</Label>
                            <Input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+966 5x xxx xxxx" dir="ltr" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>المدينة</Label>
                            <Input value={city} onChange={e => setCity(e.target.value)} placeholder="الرياض" />
                          </div>
                          <div className="space-y-2">
                            <Label>الدولة</Label>
                            <Input value={country} onChange={e => setCountry(e.target.value)} placeholder="السعودية" />
                          </div>
                        </div>
                        <Button onClick={handleUpdateProfile} disabled={saving} className="gap-2">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          حفظ التغييرات
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Notification Preferences */}
                <TabsContent value="notifications">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4 text-primary" />تفضيلات الإشعارات البريدية</CardTitle>
                        <CardDescription>اختر أنواع الإشعارات التي تريد تلقيها على بريدك الإلكتروني</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {[
                          { label: 'إنشاء تذكرة جديدة', desc: 'عند إنشاء تذكرة جديدة مرتبطة بك', checked: notifyTicketCreated, onChange: setNotifyTicketCreated },
                          { label: 'تعيين تذكرة', desc: 'عند تعيين تذكرة لك', checked: notifyTicketAssigned, onChange: setNotifyTicketAssigned },
                          { label: 'تغيير حالة التذكرة', desc: 'عند تغيير حالة تذكرة تابعة لك', checked: notifyStatusChanged, onChange: setNotifyStatusChanged },
                          { label: 'تعليقات جديدة', desc: 'عند إضافة تعليق على تذكرتك', checked: notifyCommentAdded, onChange: setNotifyCommentAdded },
                          { label: 'تنبيهات SLA', desc: 'عند اقتراب أو تجاوز مهلة SLA', checked: notifySlaBreach, onChange: setNotifySlaBreach },
                          { label: 'قرارات الاعتماد', desc: 'عند الموافقة أو الرفض على اعتماد', checked: notifyApproval, onChange: setNotifyApproval },
                          { label: 'التقارير الأسبوعية', desc: 'ملخص أسبوعي لنشاط التذاكر', checked: notifyWeeklyReport, onChange: setNotifyWeeklyReport },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/30 transition-colors">
                            <div>
                              <p className="font-medium text-sm text-foreground">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                            <Switch checked={item.checked} onCheckedChange={item.onChange} />
                          </div>
                        ))}
                        <Button onClick={handleSaveNotifications} disabled={savingNotifs} className="w-full gap-2">
                          {savingNotifs ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          حفظ تفضيلات الإشعارات
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Security */}
                <TabsContent value="security">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2"><Lock className="h-4 w-4 text-primary" />تغيير كلمة المرور</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>كلمة المرور الجديدة</Label>
                          <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                          <Label>تأكيد كلمة المرور</Label>
                          <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                        </div>
                        <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword} variant="outline" className="gap-2">
                          {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                          تغيير كلمة المرور
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
