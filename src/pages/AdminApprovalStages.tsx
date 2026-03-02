import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApprovalStages, createApprovalStage, updateApprovalStage, deleteApprovalStage, fetchDepartments, fetchAgents, ApprovalStageType, AppRole, roleLabels } from '@/lib/api';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, ShieldCheck, ArrowDown, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

const stageTypeLabels: Record<ApprovalStageType, string> = {
  sequential: 'تسلسلي',
  parallel: 'متوازي',
};

export default function AdminApprovalStages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterDept, setFilterDept] = useState<string>('all');

  // Form state
  const [departmentId, setDepartmentId] = useState('');
  const [stageName, setStageName] = useState('');
  const [stageOrder, setStageOrder] = useState(1);
  const [stageType, setStageType] = useState<ApprovalStageType>('sequential');
  const [approverRole, setApproverRole] = useState<AppRole>('agent');

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['approval-stages'],
    queryFn: () => fetchApprovalStages(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  const createMut = useMutation({
    mutationFn: () => createApprovalStage({
      department_id: departmentId,
      stage_name: stageName.trim(),
      stage_order: stageOrder,
      stage_type: stageType,
      approver_role: approverRole,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-stages'] });
      toast({ title: 'تم إنشاء مرحلة الاعتماد' });
      resetForm();
    },
    onError: (err: any) => toast({ title: 'خطأ', description: err.message, variant: 'destructive' }),
  });

  const updateMut = useMutation({
    mutationFn: () => updateApprovalStage(editId!, {
      department_id: departmentId,
      stage_name: stageName.trim(),
      stage_order: stageOrder,
      stage_type: stageType,
      approver_role: approverRole,
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
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-bold">مراحل الاعتماد</h1>
            </div>
            <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
              <DialogTrigger asChild>
                <Button className="gradient-accent text-accent-foreground gap-2 text-sm">
                  <Plus className="h-4 w-4" /> مرحلة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>{editId ? 'تعديل المرحلة' : 'إنشاء مرحلة اعتماد'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>القسم *</Label>
                    <Select value={departmentId} onValueChange={setDepartmentId}>
                      <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                      <SelectContent>
                        {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>اسم المرحلة *</Label>
                    <Input value={stageName} onChange={e => setStageName(e.target.value)} placeholder="مثال: موافقة المدير المباشر" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>الترتيب</Label>
                      <Input type="number" min={1} value={stageOrder} onChange={e => setStageOrder(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>نوع المرحلة</Label>
                      <Select value={stageType} onValueChange={v => setStageType(v as ApprovalStageType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent">{roleLabels.agent}</SelectItem>
                        <SelectItem value="admin">{roleLabels.admin}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full gradient-accent text-accent-foreground"
                    disabled={!stageName.trim() || !departmentId || createMut.isPending || updateMut.isPending}
                    onClick={() => editId ? updateMut.mutate() : createMut.mutate()}
                  >
                    {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    {editId ? 'تحديث' : 'إنشاء'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {/* Filter */}
            <div className="max-w-3xl mx-auto mb-6">
              <Select value={filterDept} onValueChange={setFilterDept}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="جميع الأقسام" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأقسام</SelectItem>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : Object.keys(grouped).length === 0 ? (
              <div className="flex flex-col items-center py-20 text-muted-foreground">
                <ShieldCheck className="h-12 w-12 mb-3 opacity-30" />
                <p>لا توجد مراحل اعتماد بعد</p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {Object.entries(grouped).map(([deptName, deptStages]) => (
                  <Card key={deptName}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{deptName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {deptStages.sort((a, b) => a.stage_order - b.stage_order).map((stage, i) => (
                        <div key={stage.id}>
                          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-xs font-bold text-accent">
                                {stage.stage_order}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{stage.stage_name}</p>
                                <div className="flex gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-[10px]">
                                    {stage.stage_type === 'parallel' ? <GitBranch className="h-2.5 w-2.5 ml-1" /> : <ArrowDown className="h-2.5 w-2.5 ml-1" />}
                                    {stageTypeLabels[stage.stage_type]}
                                  </Badge>
                                  <Badge variant="outline" className="text-[10px]">{roleLabels[stage.approver_role]}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(stage)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMut.mutate(stage.id)} disabled={deleteMut.isPending}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          {i < deptStages.length - 1 && (
                            <div className="flex justify-center py-1">
                              <ArrowDown className="h-3 w-3 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
