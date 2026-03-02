import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/lib/api';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Building2 } from 'lucide-react';

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
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-bold">إدارة الأقسام</h1>
            </div>
            <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
              <DialogTrigger asChild>
                <Button className="gradient-accent text-accent-foreground gap-2 text-sm">
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
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: تقنية المعلومات" />
                  </div>
                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف مختصر" />
                  </div>
                  <Button
                    className="w-full gradient-accent text-accent-foreground"
                    disabled={!name.trim() || createMut.isPending || updateMut.isPending}
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
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : departments.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-muted-foreground">
                <Building2 className="h-12 w-12 mb-3 opacity-30" />
                <p>لا توجد أقسام بعد</p>
              </div>
            ) : (
              <div className="grid gap-4 max-w-3xl mx-auto">
                {departments.map(dept => (
                  <Card key={dept.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-semibold">{dept.name}</p>
                        {dept.description && <p className="text-sm text-muted-foreground">{dept.description}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(dept)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(dept.id)} disabled={deleteMut.isPending}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
