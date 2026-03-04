import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllUsers, updateUserRole, AppRole, roleLabels } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const roles: AppRole[] = ['requester', 'agent', 'developer', 'admin'];

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('requester');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: fetchAllUsers,
  });

  const roleMut = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AppRole }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast({ title: 'تم تحديث الدور' });
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    },
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast({ title: 'جميع الحقول مطلوبة', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('create-user', {
        body: { email: newEmail.trim(), password: newPassword, full_name: newName.trim(), role: newRole },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      toast({ title: 'تم إنشاء المستخدم بنجاح' });
      setOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('requester');
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    } catch (err: any) {
      toast({ title: 'خطأ في إنشاء المستخدم', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 gap-3 shrink-0 sticky top-0 z-30"
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-bold text-foreground">إدارة المستخدمين</h1>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 gradient-accent text-accent-foreground shadow-lg shadow-primary/20 rounded-xl">
                  <UserPlus className="h-4 w-4" />
                  مستخدم جديد
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>إنشاء مستخدم جديد</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>الاسم الكامل *</Label>
                    <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="أحمد محمد" required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني *</Label>
                    <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@example.com" required dir="ltr" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>كلمة المرور *</Label>
                    <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="6 أحرف على الأقل" required dir="ltr" minLength={6} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>الدور</Label>
                    <Select value={newRole} onValueChange={v => setNewRole(v as AppRole)}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {roles.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full gradient-accent text-accent-foreground rounded-xl" disabled={creating}>
                    {creating ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                    إنشاء المستخدم
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </motion.header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : users.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-20 text-muted-foreground">
                <Users className="h-12 w-12 mb-3 opacity-30" />
                <p>لا يوجد مستخدمين</p>
              </motion.div>
            ) : (
              <motion.div variants={pageVariants} initial="hidden" animate="visible" className="max-w-3xl mx-auto space-y-3">
                {users.map((u: any) => (
                  <motion.div key={u.id} variants={fadeUp} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                    <Card className="rounded-2xl border-border/50 shadow-card hover:shadow-card-hover transition-shadow duration-300">
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-sm font-bold text-primary-foreground shrink-0">
                            {u.full_name?.charAt(0) || 'م'}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{u.full_name || 'بدون اسم'}</p>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                        <Select
                          value={u.role}
                          onValueChange={(v) => roleMut.mutate({ userId: u.id, role: v as AppRole })}
                        >
                          <SelectTrigger className="w-32 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(r => (
                              <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
