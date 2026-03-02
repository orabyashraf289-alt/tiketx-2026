import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/lib/api';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
      toast({ title: 'تم إنشاء القسم' });
      resetForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: () => updateDepartment(editId!, { name: name.trim(), description: description.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({ title: 'تم تحديث القسم' });
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({ title: 'تم حذف القسم' });
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
              <h1 className="text-lg font-bold text-foreground">إدارة الأقسام</h1>
            </div>
            <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
              <DialogTrigger asChild>
                <Button className="gradient-accent text-accent-foreground gap-2 text-sm shadow-lg shadow-primary/20 rounded-xl">
                  <Plus className="h-4 w-4" /> قسم جديد
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>{editId ? 'تعديل القسم' : 'إنشاء قسم جديد'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>اسم القسم *</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: تقنية المعلومات" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف مختصر" className="rounded-xl" />
                  </div>
                  <Button
                    className="w-full gradient-accent text-accent-foreground rounded-xl"
                    disabled={!name.trim() || createMut.isPending || updateMut.isPending}
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
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : departments.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-20 text-muted-foreground">
                <Building2 className="h-12 w-12 mb-3 opacity-30" />
                <p>لا توجد أقسام بعد</p>
              </motion.div>
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
        </div>
      </div>
    </SidebarProvider>
  );
}
