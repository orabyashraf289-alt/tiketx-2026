import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSystems, fetchServices, fetchServiceCategories,
  createService, updateService, deleteService,
  createServiceCategory, deleteServiceCategory,
  fetchDepartments, fetchSLAPolicies,
  System, Service, ServiceCategory,
} from '@/lib/api';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2, Server, FolderOpen, Tag } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function AdminServiceCatalog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: systems = [] } = useQuery({ queryKey: ['systems'], queryFn: fetchSystems });
  const { data: services = [] } = useQuery({ queryKey: ['services'], queryFn: () => fetchServices() });
  const { data: categories = [] } = useQuery({ queryKey: ['service-categories'], queryFn: () => fetchServiceCategories() });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });
  const { data: slaPolicies = [] } = useQuery({ queryKey: ['sla-policies'], queryFn: fetchSLAPolicies });

  const [svcOpen, setSvcOpen] = useState(false);
  const [svcSystemId, setSvcSystemId] = useState('');
  const [svcName, setSvcName] = useState('');
  const [svcDept, setSvcDept] = useState('');
  const [svcSla, setSvcSla] = useState('');

  const [catOpen, setCatOpen] = useState(false);
  const [catServiceId, setCatServiceId] = useState('');
  const [catName, setCatName] = useState('');

  const createSvcMut = useMutation({
    mutationFn: () => createService({
      system_id: svcSystemId,
      name: svcName.trim(),
      default_assignment_group: svcDept || undefined,
      sla_policy_id: svcSla || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: 'تم إنشاء الخدمة' });
      setSvcOpen(false);
      setSvcName('');
      setSvcSystemId('');
      setSvcDept('');
      setSvcSla('');
    },
  });

  const deleteSvcMut = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: 'تم حذف الخدمة' });
    },
  });

  const createCatMut = useMutation({
    mutationFn: () => createServiceCategory({ service_id: catServiceId, name: catName.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      toast({ title: 'تم إنشاء التصنيف' });
      setCatOpen(false);
      setCatName('');
      setCatServiceId('');
    },
  });

  const deleteCatMut = useMutation({
    mutationFn: deleteServiceCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      toast({ title: 'تم حذف التصنيف' });
    },
  });

  const priorityLabels: Record<string, string> = { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة' };

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
              <h1 className="text-lg font-bold text-foreground">كتالوج الخدمات</h1>
            </div>
            <div className="flex gap-2">
              <Dialog open={svcOpen} onOpenChange={setSvcOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gradient-accent text-accent-foreground gap-1 text-xs shadow-lg shadow-primary/20 rounded-xl">
                    <Plus className="h-3.5 w-3.5" /> خدمة
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader><DialogTitle>إضافة خدمة جديدة</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>النظام *</Label>
                      <Select value={svcSystemId} onValueChange={setSvcSystemId}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر النظام" /></SelectTrigger>
                        <SelectContent>
                          {systems.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>اسم الخدمة *</Label>
                      <Input value={svcName} onChange={e => setSvcName(e.target.value)} placeholder="مثال: الموارد البشرية" className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>فريق مسؤول</Label>
                      <Select value={svcDept} onValueChange={setSvcDept}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                        <SelectContent>
                          {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>سياسة SLA</Label>
                      <Select value={svcSla} onValueChange={setSvcSla}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر سياسة SLA" /></SelectTrigger>
                        <SelectContent>
                          {slaPolicies.map(p => <SelectItem key={p.id} value={p.id}>{priorityLabels[p.priority]} ({p.first_response_minutes}د / {p.resolution_minutes}د)</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full gradient-accent text-accent-foreground rounded-xl" disabled={!svcSystemId || !svcName.trim() || createSvcMut.isPending} onClick={() => createSvcMut.mutate()}>
                      {createSvcMut.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                      إنشاء
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={catOpen} onOpenChange={setCatOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1 text-xs rounded-xl">
                    <Plus className="h-3.5 w-3.5" /> تصنيف فرعي
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader><DialogTitle>إضافة تصنيف فرعي</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>الخدمة *</Label>
                      <Select value={catServiceId} onValueChange={setCatServiceId}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر الخدمة" /></SelectTrigger>
                        <SelectContent>
                          {services.map(s => <SelectItem key={s.id} value={s.id}>{s.systems?.name} → {s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>اسم التصنيف *</Label>
                      <Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="مثال: مشكلة في الدخول" className="rounded-xl" />
                    </div>
                    <Button className="w-full gradient-accent text-accent-foreground rounded-xl" disabled={!catServiceId || !catName.trim() || createCatMut.isPending} onClick={() => createCatMut.mutate()}>
                      {createCatMut.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                      إنشاء
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <motion.div variants={pageVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto">
              <Accordion type="multiple" className="space-y-3">
                {systems.map((system, si) => {
                  const sysServices = services.filter(s => s.system_id === system.id);
                  return (
                    <motion.div key={system.id} variants={fadeUp}>
                      <AccordionItem value={system.id} className="border rounded-2xl bg-card border-border/50 shadow-card overflow-hidden">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shrink-0">
                              <Server className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <span className="font-semibold text-foreground">{system.name}</span>
                            <span className="text-xs text-muted-foreground">({system.code})</span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{sysServices.length} خدمة</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          {sysServices.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">لا توجد خدمات</p>
                          ) : (
                            <div className="space-y-3">
                              {sysServices.map(svc => {
                                const svcCats = categories.filter(c => c.service_id === svc.id);
                                return (
                                  <Card key={svc.id} className="border-dashed rounded-xl">
                                    <CardContent className="py-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <FolderOpen className="h-4 w-4 text-accent" />
                                          <span className="font-medium text-sm">{svc.name}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => deleteSvcMut.mutate(svc.id)}>
                                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                        </Button>
                                      </div>
                                      <div className="flex gap-4 text-xs text-muted-foreground mb-2">
                                        {svc.departments?.name && <span>الفريق: {svc.departments.name}</span>}
                                        {svc.sla_policies && <span>SLA: {svc.sla_policies.response_time_hours}h استجابة / {svc.sla_policies.resolution_time_hours}h حل</span>}
                                      </div>
                                      {svcCats.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                          {svcCats.map(cat => (
                                            <span key={cat.id} className="inline-flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-lg">
                                              <Tag className="h-3 w-3" />
                                              {cat.name}
                                              <button onClick={() => deleteCatMut.mutate(cat.id)} className="hover:text-destructive transition-colors">×</button>
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  );
                })}
              </Accordion>
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
