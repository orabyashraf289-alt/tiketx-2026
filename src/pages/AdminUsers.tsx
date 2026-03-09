import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllUsers, updateUserRole, fetchSystems, fetchServices, fetchDepartments, AppRole } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { sanitizeError } from '@/lib/errorHandler';
import { Loader2, Users, UserPlus, Settings2, X, Pencil, Trash2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { useLanguage } from '@/i18n';
import { useLocalizedLabels } from '@/hooks/useLocalizedLabels';

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
  const { t, isRTL } = useLanguage();
  const { roleLabels } = useLocalizedLabels();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [selectedDev, setSelectedDev] = useState<any>(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Create form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('requester');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newEmployeeNumber, setNewEmployeeNumber] = useState('');

  // Edit form
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editDeptId, setEditDeptId] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editPhone, setEditPhone] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editEmployeeNumber, setEditEmployeeNumber] = useState('');
  const [editManagerId, setEditManagerId] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: fetchAllUsers,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  const { data: systems = [] } = useQuery({
    queryKey: ['systems'],
    queryFn: fetchSystems,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => fetchServices(),
  });

  const { data: devAccess = [], refetch: refetchAccess } = useQuery({
    queryKey: ['developer-access-all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('developer_access')
        .select('*, systems(name, code), services(name)');
      return data || [];
    },
  });

  const roleMut = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AppRole }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast({ title: t.admin.roleUpdated });
    },
    onError: (err: any) => {
      toast({ title: t.common.error, description: sanitizeError(err), variant: 'destructive' });
    },
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast({ title: t.admin.allFieldsRequired, variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: t.admin.passwordMinLength, variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const res = await supabase.functions.invoke('create-user', {
        body: {
          action: 'create', email: newEmail.trim(), password: newPassword, full_name: newName.trim(),
          role: newRole, job_title: newJobTitle.trim() || null,
          phone: newPhone.trim() || null, mobile: newMobile.trim() || null,
          employee_number: newEmployeeNumber.trim() || null,
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      toast({ title: t.admin.userCreated });
      setOpen(false);
      setNewName(''); setNewEmail(''); setNewPassword(''); setNewRole('requester');
      setNewJobTitle(''); setNewPhone(''); setNewMobile(''); setNewEmployeeNumber('');
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    } catch (err: any) {
      toast({ title: t.admin.userCreateError, description: sanitizeError(err), variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (user: any) => {
    setEditUser(user);
    setEditName(user.full_name || '');
    setEditEmail(user.email || '');
    setEditJobTitle(user.job_title || '');
    setEditDeptId(user.department_id || '');
    setEditActive(user.is_active !== false);
    setEditPhone(user.phone || '');
    setEditMobile(user.mobile || '');
    setEditCity(user.city || '');
    setEditCountry(user.country || '');
    setEditEmployeeNumber(user.employee_number || '');
    setEditManagerId(user.manager_id || '');
    setEditOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const res = await supabase.functions.invoke('create-user', {
        body: {
          action: 'update',
          user_id: editUser.id,
          full_name: editName.trim(),
          email: editEmail.trim() !== editUser.email ? editEmail.trim() : undefined,
          job_title: editJobTitle.trim() || null,
          department_id: editDeptId || null,
          is_active: editActive,
          phone: editPhone.trim() || null,
          mobile: editMobile.trim() || null,
          city: editCity.trim() || null,
          country: editCountry.trim() || null,
          employee_number: editEmployeeNumber.trim() || null,
          manager_id: editManagerId || null,
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      toast({ title: t.admin.userUpdated });
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    } catch (err: any) {
      toast({ title: t.common.error, description: sanitizeError(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await supabase.functions.invoke('create-user', {
        body: { action: 'delete', user_id: userId },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      toast({ title: t.admin.userDeleted });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    } catch (err: any) {
      toast({ title: t.common.error, description: sanitizeError(err), variant: 'destructive' });
    }
  };

  const openAccessDialog = (user: any) => {
    setSelectedDev(user);
    setAccessOpen(true);
  };

  const devAccessForUser = (userId: string) => devAccess.filter((a: any) => a.developer_id === userId);

  const toggleSystemAccess = async (devId: string, systemId: string) => {
    const existing = devAccess.find((a: any) => a.developer_id === devId && a.system_id === systemId && !a.service_id);
    if (existing) {
      await supabase.from('developer_access').delete().eq('id', existing.id);
    } else {
      await supabase.from('developer_access').insert({ developer_id: devId, system_id: systemId });
    }
    refetchAccess();
  };

  const toggleServiceAccess = async (devId: string, serviceId: string) => {
    const existing = devAccess.find((a: any) => a.developer_id === devId && a.service_id === serviceId);
    if (existing) {
      await supabase.from('developer_access').delete().eq('id', existing.id);
    } else {
      await supabase.from('developer_access').insert({ developer_id: devId, service_id: serviceId });
    }
    refetchAccess();
  };

  const clearAllAccess = async (devId: string) => {
    await supabase.from('developer_access').delete().eq('developer_id', devId);
    refetchAccess();
    toast({ title: t.admin.allAccessCleared });
  };

  const filteredUsers = users.filter((u: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.full_name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.job_title?.toLowerCase().includes(s);
  });

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
              <Users className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">{t.admin.userManagement}</h1>
              <Badge variant="secondary" className="text-xs">{users.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <UserPlus className="h-4 w-4" />
                    {t.admin.newUser}
                  </Button>
                </DialogTrigger>
                <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="max-w-lg max-h-[85vh] overflow-auto">
                  <DialogHeader><DialogTitle>{t.admin.createNewUser}</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>{t.admin.fullName}</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder={t.admin.fullNamePlaceholder} required /></div>
                      <div><Label>{t.admin.jobTitleLabel}</Label><Input value={newJobTitle} onChange={e => setNewJobTitle(e.target.value)} placeholder={t.admin.jobTitlePlaceholder} /></div>
                    </div>
                    <div><Label>{t.admin.emailRequired}</Label><Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@example.com" required dir="ltr" /></div>
                    <div><Label>{t.admin.passwordRequired}</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="6+" required dir="ltr" minLength={6} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>{t.admin.phoneLabel}</Label><Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+966 1x xxx xxxx" dir="ltr" /></div>
                      <div><Label>{t.admin.mobileLabel}</Label><Input value={newMobile} onChange={e => setNewMobile(e.target.value)} placeholder="+966 5x xxx xxxx" dir="ltr" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>{t.admin.employeeNumberLabel}</Label><Input value={newEmployeeNumber} onChange={e => setNewEmployeeNumber(e.target.value)} placeholder="EMP-001" /></div>
                      <div><Label>{t.admin.roleLabel}</Label>
                        <Select value={newRole} onValueChange={v => setNewRole(v as AppRole)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={creating}>
                      {creating && <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />}{t.admin.createUser}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <NotificationsPopover />
            </div>
          </motion.header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.admin.searchByNameEmailJob} className={isRTL ? 'pr-10' : 'pl-10'} />
              </div>

              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-muted-foreground">
                  <Users className="h-12 w-12 mb-3 opacity-30" />
                  <p>{search ? t.common.noResults : t.admin.noUsers}</p>
                </div>
              ) : (
                <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-3">
                  {filteredUsers.map((u: any) => (
                    <motion.div key={u.id} variants={fadeUp}>
                      <Card className="rounded-2xl border-border/50 hover:shadow-md transition-shadow">
                        <CardContent className="flex items-center justify-between py-4 gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shrink-0">
                              {u.full_name?.charAt(0) || 'م'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-foreground">{u.full_name || 'بدون اسم'}</p>
                            {!u.is_active && <Badge variant="destructive" className="text-[10px]">{t.admin.disabled}</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                              <div className="flex items-center gap-3 flex-wrap">
                                {u.job_title && <p className="text-xs text-muted-foreground/70">{u.job_title}</p>}
                                {u.employee_number && <span className="text-[10px] text-muted-foreground/50">#{u.employee_number}</span>}
                                {u.mobile && <span className="text-[10px] text-muted-foreground/50">📱 {u.mobile}</span>}
                              </div>
                              {u.role === 'developer' && devAccessForUser(u.id).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {devAccessForUser(u.id).map((a: any) => (
                                    <Badge key={a.id} variant="outline" className="text-[10px] px-1.5 py-0">
                                      {a.systems?.name || a.services?.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {u.role === 'developer' && (
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openAccessDialog(u)} title={t.admin.devPermissions}>
                                <Settings2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditDialog(u)} title={t.common.edit}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Select value={u.role} onValueChange={v => roleMut.mutate({ userId: u.id, role: v as AppRole })}>
                              <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}</SelectContent>
                            </Select>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title={t.common.delete}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t.admin.deleteUser}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t.admin.deleteUserConfirm}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2">
                                  <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteUser(u.id)}>
                                    {t.common.delete}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </main>

          {/* Edit User Dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="max-w-lg max-h-[85vh] overflow-auto">
              <DialogHeader><DialogTitle>{t.admin.editUser}</DialogTitle></DialogHeader>
              {editUser && (
                <div className="space-y-4 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>{t.admin.fullName}</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
                    <div><Label>{t.admin.emailRequired}</Label><Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} dir="ltr" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>{t.admin.jobTitleLabel}</Label><Input value={editJobTitle} onChange={e => setEditJobTitle(e.target.value)} placeholder={t.admin.jobTitlePlaceholder} /></div>
                    <div><Label>{t.admin.employeeNumberLabel}</Label><Input value={editEmployeeNumber} onChange={e => setEditEmployeeNumber(e.target.value)} placeholder="EMP-001" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>{t.admin.phoneLabel}</Label><Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+966 1x xxx xxxx" dir="ltr" /></div>
                    <div><Label>{t.admin.mobileLabel}</Label><Input value={editMobile} onChange={e => setEditMobile(e.target.value)} placeholder="+966 5x xxx xxxx" dir="ltr" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>{t.admin.cityLabel}</Label><Input value={editCity} onChange={e => setEditCity(e.target.value)} /></div>
                    <div><Label>{t.admin.countryLabel}</Label><Input value={editCountry} onChange={e => setEditCountry(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>{t.admin.departmentLabel}</Label>
                      <Select value={editDeptId} onValueChange={setEditDeptId}>
                        <SelectTrigger><SelectValue placeholder={t.common.none} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t.common.none}</SelectItem>
                          {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>{t.admin.managerLabel}</Label>
                      <Select value={editManagerId} onValueChange={setEditManagerId}>
                        <SelectTrigger><SelectValue placeholder={t.common.none} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t.common.none}</SelectItem>
                          {users.filter((u: any) => u.id !== editUser?.id).map((u: any) => (
                            <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>{t.admin.activeStatus}</Label>
                    <Switch checked={editActive} onCheckedChange={setEditActive} />
                  </div>
                  <Button className="w-full" onClick={handleUpdateUser} disabled={saving}>
                    {saving && <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />}{t.common.saveChanges}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Developer Access Dialog */}
          <Dialog open={accessOpen} onOpenChange={setAccessOpen}>
            <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  {t.admin.devAccessTitle}: {selectedDev?.full_name}
                </DialogTitle>
              </DialogHeader>
              {selectedDev && (
                <div className="space-y-4 mt-2 max-h-[60vh] overflow-auto">
                  <p className="text-xs text-muted-foreground">
                    {lang === 'ar' ? 'اختر الأنظمة والخدمات التي يمكن للمطور الوصول إليها. إذا لم يتم تحديد أي خيار، سيتمكن من الوصول لكل شيء.' : 'Select the systems and services the developer can access. If none are selected, they can access everything.'}
                  </p>
                  {devAccessForUser(selectedDev.id).length > 0 && (
                    <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => clearAllAccess(selectedDev.id)}>
                      <X className="h-3 w-3" />{t.admin.clearAllAccess}
                    </Button>
                  )}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">{t.admin.systemAccess}</Label>
                    {systems.map(sys => {
                      const checked = devAccess.some((a: any) => a.developer_id === selectedDev.id && a.system_id === sys.id && !a.service_id);
                      return (
                        <div key={sys.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                          <Checkbox checked={checked} onCheckedChange={() => toggleSystemAccess(selectedDev.id, sys.id)} />
                          <div><p className="text-sm font-medium">{sys.name}</p><p className="text-xs text-muted-foreground">{sys.code}</p></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">{t.admin.serviceAccess}</Label>
                    {services.map(svc => {
                      const checked = devAccess.some((a: any) => a.developer_id === selectedDev.id && a.service_id === svc.id);
                      return (
                        <div key={svc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                          <Checkbox checked={checked} onCheckedChange={() => toggleServiceAccess(selectedDev.id, svc.id)} />
                          <div><p className="text-sm font-medium">{svc.name}</p><p className="text-xs text-muted-foreground">{svc.systems?.name || ''}</p></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </SidebarProvider>
  );
}
