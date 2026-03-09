import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApprovalStages, createApprovalStage, updateApprovalStage, deleteApprovalStage, fetchDepartments, fetchAgents, fetchServices, ApprovalStageType, AppRole } from '@/lib/api';
import { sanitizeError } from '@/lib/errorHandler';
import { PageLayout, PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, ShieldCheck, ArrowDown, GitBranch, User, Clock, AlertTriangle, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n';
import { useLocalizedLabels } from '@/hooks/useLocalizedLabels';

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function AdminApprovalStages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, isRTL } = useLanguage();
  const { roleLabels } = useLocalizedLabels();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterDept, setFilterDept] = useState<string>('all');

  const [departmentId, setDepartmentId] = useState('');
  const [stageName, setStageName] = useState('');
  const [stageOrder, setStageOrder] = useState(1);
  const [stageType, setStageType] = useState<ApprovalStageType>('sequential');
  const [approverRole, setApproverRole] = useState<AppRole>('agent');
  const [approverId, setApproverId] = useState<string>('none');
  const [serviceId, setServiceId] = useState<string>('none');
  const [deadlineHours, setDeadlineHours] = useState<string>('');
  const [escalationTo, setEscalationTo] = useState<string>('none');

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['approval-stages'],
    queryFn: () => fetchApprovalStages(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => fetchServices(),
  });

  const createMut = useMutation({
    mutationFn: () => createApprovalStage({
      department_id: departmentId,
      stage_name: stageName.trim(),
      stage_order: stageOrder,
      stage_type: stageType,
      approver_role: approverRole,
      approver_id: approverId !== 'none' ? approverId : null,
      service_id: serviceId !== 'none' ? serviceId : null,
      deadline_hours: deadlineHours ? Number(deadlineHours) : null,
      escalation_to: escalationTo !== 'none' ? escalationTo : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-stages'] });
      toast({ title: 'تم إنشاء مرحلة الاعتماد' });
      resetForm();
    },
    onError: (err: any) => toast({ title: 'خطأ', description: sanitizeError(err), variant: 'destructive' }),
  });

  const updateMut = useMutation({
    mutationFn: () => updateApprovalStage(editId!, {
      department_id: departmentId,
      stage_name: stageName.trim(),
      stage_order: stageOrder,
      stage_type: stageType,
      approver_role: approverRole,
      approver_id: approverId !== 'none' ? approverId : null,
      service_id: serviceId !== 'none' ? serviceId : null,
      deadline_hours: deadlineHours ? Number(deadlineHours) : null,
      escalation_to: escalationTo !== 'none' ? escalationTo : null,
    } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-stages'] });
      toast({ title: 'تم تحديث المرحلة' });
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteApprovalStage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-stages'] });
      toast({ title: 'تم حذف المرحلة' });
    },
  });

  const resetForm = () => {
    setStageName('');
    setDepartmentId('');
    setStageOrder(1);
    setStageType('sequential');
    setApproverRole('agent');
    setApproverId('none');
    setServiceId('none');
    setDeadlineHours('');
    setEscalationTo('none');
    setEditId(null);
    setOpen(false);
  };

  const startEdit = (stage: any) => {
    setEditId(stage.id);
    setDepartmentId(stage.department_id);
    setStageName(stage.stage_name);
    setStageOrder(stage.stage_order);
    setStageType(stage.stage_type);
    setApproverRole(stage.approver_role);
    setApproverId(stage.approver_id || 'none');
    setServiceId(stage.service_id || 'none');
    setDeadlineHours(stage.deadline_hours?.toString() || '');
    setEscalationTo(stage.escalation_to || 'none');
    setOpen(true);
  };

  const filtered = filterDept === 'all' ? stages : stages.filter(s => s.department_id === filterDept);
  const grouped = filtered.reduce((acc, s) => {
    const deptName = s.departments?.name || 'بدون قسم';
    if (!acc[deptName]) acc[deptName] = [];
    acc[deptName].push(s);
    return acc;
  }, {} as Record<string, typeof stages>);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 shrink-0 sticky top-0 z-30"
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-bold text-foreground">مراحل الاعتماد</h1>
            </div>
            <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
              <DialogTrigger asChild>
                <Button className="gradient-accent text-accent-foreground gap-2 text-sm shadow-lg shadow-primary/20 rounded-xl">
                  <Plus className="h-4 w-4" /> مرحلة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editId ? 'تعديل المرحلة' : 'إنشاء مرحلة اعتماد'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>القسم *</Label>
                    <Select value={departmentId} onValueChange={setDepartmentId}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                      <SelectContent>
                        {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>اسم المرحلة *</Label>
                    <Input value={stageName} onChange={e => setStageName(e.target.value)} placeholder="مثال: موافقة المدير المباشر" className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>الترتيب</Label>
                      <Input type="number" min={1} value={stageOrder} onChange={e => setStageOrder(Number(e.target.value))} className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>نوع المرحلة</Label>
                      <Select value={stageType} onValueChange={v => setStageType(v as ApprovalStageType)}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sequential">تسلسلي</SelectItem>
                          <SelectItem value="parallel">متوازي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>دور المعتمد</Label>
                    <Select value={approverRole} onValueChange={v => setApproverRole(v as AppRole)}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent">{roleLabels.agent}</SelectItem>
                        <SelectItem value="admin">{roleLabels.admin}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* New: Specific Approver */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> معتمد محدد (اختياري)</Label>
                    <Select value={approverId} onValueChange={setApproverId}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="أي شخص بالدور المحدد" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">أي شخص بالدور المحدد</SelectItem>
                        {agents.map(a => <SelectItem key={a.user_id} value={a.user_id}>{a.profiles?.full_name} ({a.profiles?.email})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* New: Link to Service */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><Server className="h-3.5 w-3.5" /> ربط بخدمة (اختياري)</Label>
                    <Select value={serviceId} onValueChange={setServiceId}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="جميع الخدمات" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">جميع الخدمات</SelectItem>
                        {services.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* New: Deadline & Escalation */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> مهلة (ساعات)</Label>
                      <Input type="number" min={1} value={deadlineHours} onChange={e => setDeadlineHours(e.target.value)} placeholder="بدون مهلة" className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> تصعيد إلى</Label>
                      <Select value={escalationTo} onValueChange={setEscalationTo}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="بدون تصعيد" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون تصعيد</SelectItem>
                          {agents.map(a => <SelectItem key={a.user_id} value={a.user_id}>{a.profiles?.full_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    className="w-full gradient-accent text-accent-foreground rounded-xl"
                    disabled={!stageName.trim() || !departmentId || createMut.isPending || updateMut.isPending}
                    onClick={() => editId ? updateMut.mutate() : createMut.mutate()}
                  >
                    {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    {editId ? 'تحديث' : 'إنشاء'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <motion.div variants={pageVariants} initial="hidden" animate="visible" className="max-w-3xl mx-auto">
              <motion.div variants={fadeUp} className="mb-6">
                <Select value={filterDept} onValueChange={setFilterDept}>
                  <SelectTrigger className="w-48 rounded-xl">
                    <SelectValue placeholder="جميع الأقسام" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأقسام</SelectItem>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </motion.div>

              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : Object.keys(grouped).length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-20 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mb-3 opacity-30" />
                  <p>لا توجد مراحل اعتماد بعد</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(grouped).map(([deptName, deptStages]) => (
                    <motion.div key={deptName} variants={fadeUp}>
                      <Card className="rounded-2xl border-border/50 shadow-card">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                              <ShieldCheck className="h-4 w-4 text-primary" />
                            </div>
                            {deptName}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {deptStages.sort((a, b) => a.stage_order - b.stage_order).map((stage, i) => (
                            <div key={stage.id}>
                              <motion.div
                                whileHover={{ scale: 1.01 }}
                                className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                                    {stage.stage_order}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{stage.stage_name}</p>
                                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                                      <Badge variant="outline" className="text-[10px] rounded-lg">
                                        {stage.stage_type === 'parallel' ? <GitBranch className="h-2.5 w-2.5 ml-1" /> : <ArrowDown className="h-2.5 w-2.5 ml-1" />}
                                        {stage.stage_type === 'sequential' ? t.admin.sequential : t.admin.parallel}
                                      </Badge>
                                      <Badge variant="outline" className="text-[10px] rounded-lg">{roleLabels[stage.approver_role]}</Badge>
                                      {stage.approver_profile?.full_name && (
                                        <Badge variant="secondary" className="text-[10px] rounded-lg gap-0.5">
                                          <User className="h-2.5 w-2.5" />
                                          {stage.approver_profile.full_name}
                                        </Badge>
                                      )}
                                      {stage.services?.name && (
                                        <Badge variant="secondary" className="text-[10px] rounded-lg gap-0.5">
                                          <Server className="h-2.5 w-2.5" />
                                          {stage.services.name}
                                        </Badge>
                                      )}
                                      {stage.deadline_hours && (
                                        <Badge variant="outline" className="text-[10px] rounded-lg gap-0.5 text-warning border-warning/30">
                                          <Clock className="h-2.5 w-2.5" />
                                          {stage.deadline_hours} ساعة
                                        </Badge>
                                      )}
                                      {stage.escalation_profile?.full_name && (
                                        <Badge variant="outline" className="text-[10px] rounded-lg gap-0.5 text-destructive border-destructive/30">
                                          <AlertTriangle className="h-2.5 w-2.5" />
                                          تصعيد: {stage.escalation_profile.full_name}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => startEdit(stage)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => deleteMut.mutate(stage.id)} disabled={deleteMut.isPending}>
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  </Button>
                                </div>
                              </motion.div>
                              {i < deptStages.length - 1 && (
                                <div className="flex justify-center py-1">
                                  <ArrowDown className="h-3 w-3 text-muted-foreground/40" />
                                </div>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
