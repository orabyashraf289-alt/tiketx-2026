import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { createTicket, addAttachment, fetchSystems, fetchServices, fetchServiceCategories, fetchServiceFields, upsertTicketFieldValues, TicketPriority } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Loader2, Send, FileText, Layers, Paperclip, Eye, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WizardProgress } from '@/components/ticket-wizard/WizardProgress';
import { FileDropZone } from '@/components/ticket-wizard/FileDropZone';
import { TicketPreview } from '@/components/ticket-wizard/TicketPreview';

const priorities: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'منخفضة' },
  { value: 'medium', label: 'متوسطة' },
  { value: 'high', label: 'عالية' },
  { value: 'urgent', label: 'عاجلة' },
];

const WIZARD_STEPS = [
  { label: 'الوصف', icon: <FileText className="h-4 w-4" /> },
  { label: 'الخدمة', icon: <Layers className="h-4 w-4" /> },
  { label: 'المرفقات', icon: <Paperclip className="h-4 w-4" /> },
  { label: 'المعاينة', icon: <Eye className="h-4 w-4" /> },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

export default function NewTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [systemId, setSystemId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [aiSuggestion, setAiSuggestion] = useState<{ system_id: string; service_id: string; reason: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: systems = [] } = useQuery({ queryKey: ['systems'], queryFn: fetchSystems });
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
  const { data: serviceFields = [] } = useQuery({
    queryKey: ['service-fields', serviceId],
    queryFn: () => fetchServiceFields(serviceId || undefined),
    enabled: !!serviceId,
  });

  const filteredServices = systemId ? services.filter(s => s.system_id === systemId) : services;

  const goNext = () => { setDirection(1); setStep(s => Math.min(s + 1, 3)); };
  const goPrev = () => { setDirection(-1); setStep(s => Math.max(s - 1, 0)); };

  const canProceed = useCallback(() => {
    if (step === 0) return title.trim().length > 0 && description.trim().length > 0;
    if (step === 1) {
      for (const field of serviceFields) {
        if (field.is_required && !customFieldValues[field.id]?.trim()) return false;
      }
      return true;
    }
    return true;
  }, [step, title, description, serviceFields, customFieldValues]);

  // AI suggestion
  const requestAiSuggestion = async () => {
    if (!title.trim()) return;
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-service', {
        body: { title: title.trim(), description: description.trim() },
      });
      if (error) throw error;
      if (data?.suggestion) {
        setAiSuggestion(data.suggestion);
      }
    } catch (e) {
      console.error('AI suggestion failed:', e);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setSystemId(aiSuggestion.system_id);
    setServiceId(aiSuggestion.service_id);
    setCategoryId('');
    toast({ title: 'تم تطبيق الاقتراح الذكي ✨' });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      // Find default_assignment_group from selected service
      const selectedService = services.find(s => s.id === serviceId);
      const departmentId = selectedService?.default_assignment_group || null;

      const ticket = await createTicket({
        title: title.trim(),
        description: description.trim(),
        priority,
        requester_id: user!.id,
        ...(departmentId ? { department_id: departmentId } : {}),
        ...(serviceId ? { service_id: serviceId } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
      } as any);

      const fieldEntries = Object.entries(customFieldValues).filter(([_, v]) => v.trim());
      if (fieldEntries.length > 0) {
        await upsertTicketFieldValues(
          fieldEntries.map(([fieldId, value]) => ({ ticket_id: ticket.id, field_id: fieldId, value }))
        );
      }

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
      toast({ title: 'تم إنشاء التذكرة بنجاح 🎉' });
      navigate('/');
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    },
  });

  const handleSubmit = () => {
    for (const field of serviceFields) {
      if (field.is_required && !customFieldValues[field.id]?.trim()) {
        toast({ title: `الحقل "${field.field_name}" مطلوب`, variant: 'destructive' });
        return;
      }
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
            <div className="max-w-2xl mx-auto">
              <WizardProgress steps={WIZARD_STEPS} currentStep={step} />

              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={step}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      {/* Step 0: Title & Description */}
                      {step === 0 && (
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="title">عنوان التذكرة *</Label>
                            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="وصف مختصر للمشكلة" maxLength={200} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="desc">الوصف التفصيلي *</Label>
                            <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="اشرح المشكلة بالتفصيل..." className="min-h-[140px]" maxLength={2000} />
                          </div>
                          <div className="space-y-2">
                            <Label>الأولوية</Label>
                            <Select value={priority} onValueChange={v => setPriority(v as TicketPriority)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {priorities.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {/* Step 1: Service Catalog */}
                      {step === 1 && (
                        <div className="space-y-5">
                          {/* AI suggestion banner */}
                          {title.trim() && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="rounded-xl border border-accent/30 bg-accent/5 p-4"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-5 w-5 text-accent" />
                                  <span className="text-sm font-medium">اقتراح ذكي</span>
                                </div>
                                {!aiSuggestion && (
                                  <Button size="sm" variant="outline" onClick={requestAiSuggestion} disabled={aiLoading} className="gap-1.5">
                                    {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                    {aiLoading ? 'جاري التحليل...' : 'اقترح تلقائياً'}
                                  </Button>
                                )}
                              </div>
                              <AnimatePresence>
                                {aiSuggestion && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 space-y-2"
                                  >
                                    <p className="text-sm text-muted-foreground">{aiSuggestion.reason}</p>
                                    <Button size="sm" onClick={applyAiSuggestion} className="gap-1.5 gradient-accent text-accent-foreground">
                                      تطبيق الاقتراح
                                    </Button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>النظام</Label>
                              <Select value={systemId} onValueChange={v => { setSystemId(v); setServiceId(''); setCategoryId(''); setAiSuggestion(null); }}>
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

                          {/* Dynamic service fields */}
                          {serviceFields.length > 0 && (
                            <div className="space-y-4 p-4 rounded-xl border border-dashed bg-muted/20">
                              <p className="text-sm font-semibold text-muted-foreground">حقول إضافية للخدمة</p>
                              {serviceFields.map(field => (
                                <div key={field.id} className="space-y-2">
                                  <Label>{field.field_name} {field.is_required && '*'}</Label>
                                  {field.field_type === 'text' && (
                                    <Input value={customFieldValues[field.id] || ''} onChange={e => setCustomFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))} placeholder={field.field_name} />
                                  )}
                                  {field.field_type === 'number' && (
                                    <Input type="number" value={customFieldValues[field.id] || ''} onChange={e => setCustomFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))} placeholder={field.field_name} />
                                  )}
                                  {field.field_type === 'textarea' && (
                                    <Textarea value={customFieldValues[field.id] || ''} onChange={e => setCustomFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))} placeholder={field.field_name} className="min-h-[80px]" />
                                  )}
                                  {field.field_type === 'select' && (
                                    <Select value={customFieldValues[field.id] || ''} onValueChange={v => setCustomFieldValues(prev => ({ ...prev, [field.id]: v }))}>
                                      <SelectTrigger><SelectValue placeholder={`اختر ${field.field_name}`} /></SelectTrigger>
                                      <SelectContent>
                                        {(field.options || []).map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Step 2: Files */}
                      {step === 2 && (
                        <FileDropZone files={files} onFilesChange={setFiles} />
                      )}

                      {/* Step 3: Preview */}
                      {step === 3 && (
                        <TicketPreview
                          title={title}
                          description={description}
                          priority={priority}
                          systemId={systemId}
                          serviceId={serviceId}
                          categoryId={categoryId}
                          files={files}
                          customFieldValues={customFieldValues}
                          systems={systems}
                          services={services}
                          categories={categories}
                          serviceFields={serviceFields}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-8 pt-5 border-t">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={goPrev}
                      disabled={step === 0}
                      className="gap-1.5"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      السابق
                    </Button>

                    {step < 3 ? (
                      <Button
                        type="button"
                        onClick={goNext}
                        disabled={!canProceed()}
                        className="gap-1.5 gradient-accent text-accent-foreground"
                      >
                        التالي
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={mutation.isPending}
                        className="gap-1.5 gradient-accent text-accent-foreground"
                      >
                        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        إرسال التذكرة
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
