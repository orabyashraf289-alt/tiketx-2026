import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchDepartments, createTicket, addAttachment, fetchSystems, fetchServices, fetchServiceCategories, TicketPriority, SourceSystem } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Loader2, Send, Paperclip, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const priorities: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'منخفضة' },
  { value: 'medium', label: 'متوسطة' },
  { value: 'high', label: 'عالية' },
  { value: 'urgent', label: 'عاجلة' },
];

export default function NewTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [departmentId, setDepartmentId] = useState('');
  const [systemId, setSystemId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  const { data: systems = [] } = useQuery({
    queryKey: ['systems'],
    queryFn: fetchSystems,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', systemId],
    queryFn: () => fetchServices(systemId || undefined),
    enabled: true,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['service-categories', serviceId],
    queryFn: () => fetchServiceCategories(serviceId || undefined),
    enabled: !!serviceId,
  });

  const filteredServices = systemId ? services.filter(s => s.system_id === systemId) : services;

  const mutation = useMutation({
    mutationFn: async () => {
      const ticket = await createTicket({
        title: title.trim(),
        description: description.trim(),
        priority,
        department_id: departmentId,
        requester_id: user!.id,
        ...(serviceId ? { service_id: serviceId } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
      } as any);
      // Upload files
      for (const file of files) {
        const filePath = `${ticket.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('ticket-attachments').upload(filePath, file);
        if (uploadError) continue;
        const { data: { publicUrl } } = supabase.storage.from('ticket-attachments').getPublicUrl(filePath);
        await addAttachment({
          ticket_id: ticket.id,
          uploaded_by: user!.id,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
        });
      }
      return ticket;
    },
    onSuccess: () => {
      toast({ title: 'تم إنشاء التذكرة بنجاح' });
      navigate('/');
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !departmentId) {
      toast({ title: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }
    mutation.mutate();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-3 shrink-0">
            <SidebarTrigger />
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">تذكرة جديدة</h1>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Card className="max-w-2xl mx-auto animate-fade-in">
              <CardHeader>
                <CardTitle>إنشاء تذكرة دعم جديدة</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="title">عنوان التذكرة *</Label>
                    <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="وصف مختصر للمشكلة" required maxLength={200} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="desc">الوصف التفصيلي *</Label>
                    <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="اشرح المشكلة بالتفصيل..." className="min-h-[120px]" required maxLength={2000} />
                  </div>

                  {/* Service Catalog */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>النظام</Label>
                      <Select value={systemId} onValueChange={v => { setSystemId(v); setServiceId(''); setCategoryId(''); }}>
                        <SelectTrigger><SelectValue placeholder="اختر النظام" /></SelectTrigger>
                        <SelectContent>
                          {systems.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>الخدمة</Label>
                      <Select value={serviceId} onValueChange={v => { setServiceId(v); setCategoryId(''); }}>
                        <SelectTrigger><SelectValue placeholder="اختر الخدمة" /></SelectTrigger>
                        <SelectContent>
                          {filteredServices.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {categories.length > 0 && (
                      <div className="space-y-2">
                        <Label>التصنيف</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                          <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                          <SelectContent>
                            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الأولوية</Label>
                      <Select value={priority} onValueChange={v => setPriority(v as TicketPriority)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {priorities.map(p => (
                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>القسم *</Label>
                      <Select value={departmentId} onValueChange={setDepartmentId}>
                        <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                        <SelectContent>
                          {departments.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* File attachments */}
                  <div className="space-y-2">
                    <Label>المرفقات</Label>
                    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => {
                      if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                      e.target.value = '';
                    }} />
                    <Button type="button" variant="outline" className="gap-2 text-sm" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-4 w-4" />
                      إضافة ملفات
                    </Button>
                    {files.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {files.map((f, i) => (
                          <span key={i} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md">
                            {f.name}
                            <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>
                              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full gradient-accent text-accent-foreground gap-2" disabled={mutation.isPending}>
                    {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    إرسال التذكرة
                  </Button>
                </form>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
