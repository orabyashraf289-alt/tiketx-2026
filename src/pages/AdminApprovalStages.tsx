import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApprovalStages, createApprovalStage, updateApprovalStage, deleteApprovalStage, fetchDepartments, fetchAgents, fetchServices, type ApprovalStage } from '@/lib/api';
import { sanitizeError } from '@/lib/errorHandler';
import { PageLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n';
import { ApprovalStageForm, type StageFormData } from '@/components/approval-stages/ApprovalStageForm';
import { DepartmentStageGroup } from '@/components/approval-stages/DepartmentStageGroup';

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
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<StageFormData> | undefined>();
  const [filterDept, setFilterDept] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<ApprovalStage | null>(null);

  const { data: stages = [], isLoading } = useQuery({ queryKey: ['approval-stages'], queryFn: () => fetchApprovalStages() });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });
  const { data: agents = [] } = useQuery({ queryKey: ['agents'], queryFn: fetchAgents });
  const { data: services = [] } = useQuery({ queryKey: ['services'], queryFn: () => fetchServices() });

  const createMut = useMutation({
    mutationFn: (data: StageFormData) => createApprovalStage(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['approval-stages'] }); toast({ title: t.admin.stageCreated }); setFormOpen(false); },
    onError: (err: any) => toast({ title: '❌', description: sanitizeError(err), variant: 'destructive' }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StageFormData }) => updateApprovalStage(id, data as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['approval-stages'] }); toast({ title: t.admin.stageUpdated }); setFormOpen(false); setEditId(null); },
    onError: (err: any) => toast({ title: '❌', description: sanitizeError(err), variant: 'destructive' }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteApprovalStage,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['approval-stages'] }); toast({ title: t.admin.stageDeleted }); setDeleteTarget(null); },
  });

  const handleSubmit = useCallback((data: StageFormData) => {
    if (editId) updateMut.mutate({ id: editId, data });
    else createMut.mutate(data);
  }, [editId, createMut, updateMut]);

  const handleEdit = useCallback((stage: ApprovalStage) => {
    setEditId(stage.id);
    setEditData({
      department_id: stage.department_id,
      stage_name: stage.stage_name,
      stage_order: stage.stage_order,
      stage_type: stage.stage_type,
      approver_role: stage.approver_role,
      approver_id: stage.approver_id,
      service_id: stage.service_id,
      deadline_hours: stage.deadline_hours,
      escalation_to: stage.escalation_to,
    });
    setFormOpen(true);
  }, []);

  const handleDuplicate = useCallback((stage: ApprovalStage) => {
    const maxOrder = stages.filter(s => s.department_id === stage.department_id).reduce((max, s) => Math.max(max, s.stage_order), 0);
    createMut.mutate({
      department_id: stage.department_id,
      stage_name: `${stage.stage_name} (${t.admin.duplicateStage})`,
      stage_order: maxOrder + 1,
      stage_type: stage.stage_type,
      approver_role: stage.approver_role,
      approver_id: stage.approver_id,
      service_id: stage.service_id,
      deadline_hours: stage.deadline_hours,
      escalation_to: stage.escalation_to,
    });
  }, [stages, createMut, t]);

  const openNewForm = useCallback(() => {
    setEditId(null);
    setEditData(undefined);
    setFormOpen(true);
  }, []);

  const filtered = useMemo(() => filterDept === 'all' ? stages : stages.filter(s => s.department_id === filterDept), [stages, filterDept]);
  const grouped = useMemo(() => {
    return filtered.reduce((acc, s) => {
      const key = s.department_id;
      const name = s.departments?.name || '—';
      if (!acc[key]) acc[key] = { name, stages: [] };
      acc[key].stages.push(s);
      return acc;
    }, {} as Record<string, { name: string; stages: ApprovalStage[] }>);
  }, [filtered]);

  return (
    <PageLayout>
      <PageHeader
        title={t.admin.approvalStagesTitle}
        icon={<ShieldCheck className="h-5 w-5" />}
        actions={
          <Button className="gradient-accent text-accent-foreground gap-2 text-sm shadow-lg shadow-primary/20 rounded-xl" onClick={openNewForm}>
            <Plus className="h-4 w-4" /> {t.admin.newStage}
          </Button>
        }
      />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <motion.div variants={pageVariants} initial="hidden" animate="visible" className="max-w-3xl mx-auto">
          {/* Toolbar */}
          <motion.div variants={fadeUp} className="mb-5 flex items-center gap-3 flex-wrap">
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-48 rounded-xl h-9">
                <SelectValue placeholder={t.common.all} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.all}</SelectItem>
                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="rounded-full text-xs px-3 py-1">
              {t.admin.totalStages}: {filtered.length}
            </Badge>
          </motion.div>

          {/* Content */}
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : Object.keys(grouped).length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-20 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mb-3 opacity-30" />
              <p>{t.admin.noStagesYet}</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([deptId, { name, stages: deptStages }]) => (
                <motion.div key={deptId} variants={fadeUp}>
                  <DepartmentStageGroup
                    deptName={name}
                    stages={deptStages}
                    onEdit={handleEdit}
                    onDelete={setDeleteTarget}
                    onDuplicate={handleDuplicate}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Form Dialog */}
      <ApprovalStageForm
        open={formOpen}
        onOpenChange={(v) => { if (!v) { setEditId(null); setEditData(undefined); } setFormOpen(v); }}
        editId={editId}
        initialData={editData}
        departments={departments}
        agents={agents}
        services={services}
        onSubmit={handleSubmit}
        isPending={createMut.isPending || updateMut.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.admin.deleteStageConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{t.admin.deleteStageDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
