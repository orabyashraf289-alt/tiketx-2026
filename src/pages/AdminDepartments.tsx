import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/lib/api';
import { PageLayout, PageHeader } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n';
import { LoadingSpinner, EmptyState } from '@/components/common';

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function AdminDepartments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, isRTL } = useLanguage();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  const createMut = useMutation({
    mutationFn: () => createDepartment({ name: name.trim(), description: description.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({ title: t.admin.deptCreated });
      resetForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: () => updateDepartment(editId!, { name: name.trim(), description: description.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({ title: t.admin.deptUpdated });
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({ title: t.admin.deptDeleted });
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setEditId(null);
    setOpen(false);
  };

  const startEdit = (dept: any) => {
    setEditId(dept.id);
    setName(dept.name);
    setDescription(dept.description || '');
    setOpen(true);
  };

  const newDeptButton = (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
      <DialogTrigger asChild>
        <Button className="gradient-accent text-accent-foreground gap-2 text-sm shadow-lg shadow-primary/20 rounded-xl">
          <Plus className="h-4 w-4" /> {t.admin.newDept}
        </Button>
      </DialogTrigger>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{editId ? t.admin.editDept : t.admin.createDept}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>{t.admin.deptName}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={t.admin.deptNamePlaceholder} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>{t.admin.deptDesc}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t.admin.deptDescPlaceholder} className="rounded-xl" />
          </div>
          <Button
            className="w-full gradient-accent text-accent-foreground rounded-xl"
            disabled={!name.trim() || createMut.isPending || updateMut.isPending}
            onClick={() => editId ? updateMut.mutate() : createMut.mutate()}
          >
            {(createMut.isPending || updateMut.isPending) && <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />}
            {editId ? t.common.update : t.common.create}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <PageLayout>
      <PageHeader
        title={t.admin.deptManagement}
        icon={<Building2 className="h-5 w-5" />}
        actions={newDeptButton}
      />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {isLoading ? (
          <LoadingSpinner size="lg" fullPage />
        ) : departments.length === 0 ? (
          <EmptyState icon={Building2} title={t.admin.noDepts} />
        ) : (
          <motion.div variants={pageVariants} initial="hidden" animate="visible" className="grid gap-4 max-w-3xl mx-auto">
            {departments.map(dept => (
              <motion.div key={dept.id} variants={fadeUp} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Card className="rounded-2xl border-border/50 shadow-card hover:shadow-card-hover transition-shadow duration-300">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{dept.name}</p>
                        {dept.description && <p className="text-sm text-muted-foreground">{dept.description}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => startEdit(dept)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => deleteMut.mutate(dept.id)} disabled={deleteMut.isPending}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </PageLayout>
  );
}
