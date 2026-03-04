import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { User, Lock, Camera, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { roleLabels } from '@/lib/api';

export default function ProfilePage() {
  const { user, profile, role } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [uploading, setUploading] = useState(false);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
      if (error) throw error;
      toast({ title: 'تم تحديث الملف الشخصي بنجاح ✅' });
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    }
    setSaving(false);
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
      setCurrentPassword('');
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
                <Card>
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
                        {role && (
                          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {roleLabels[role]}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Edit Name */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardHeader><CardTitle className="text-sm">تعديل المعلومات</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>الاسم الكامل</Label>
                      <Input value={fullName} onChange={e => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input value={profile?.email || ''} disabled className="bg-muted" />
                    </div>
                    <Button onClick={handleUpdateProfile} disabled={saving || fullName === profile?.full_name} className="gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      حفظ التغييرات
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Change Password */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Lock className="h-4 w-4" /> تغيير كلمة المرور</CardTitle></CardHeader>
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
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
