import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { createTicket, addAttachment, fetchSystems, fetchServices, fetchServiceCategories, fetchServiceFields, upsertTicketFieldValues, TicketPriority } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { sanitizeError } from '@/lib/errorHandler';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowRight, ArrowLeft, Loader2, Send, FileText, Layers, Paperclip, Eye, Sparkles, User, Mail, Building2, Monitor, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WizardProgress } from '@/components/ticket-wizard/WizardProgress';
import { FileDropZone } from '@/components/ticket-wizard/FileDropZone';
import { TicketPreview } from '@/components/ticket-wizard/TicketPreview';
import { TicketTemplatesPicker } from '@/components/TicketTemplates';

const priorities: { value: TicketPriority; label: string; color: string }[] = [
  { value: 'low', label: 'منخفضة', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { value: 'medium', label: 'متوسطة', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { value: 'high', label: 'عالية', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  { value: 'urgent', label: 'عاجلة', color: 'bg-destructive/10 text-destructive border-destructive/20' },
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

// System icons/colors mapping
const systemStyles: Record<string, { icon: string; gradient: string }> = {
  'ERP': { icon: '🏢', gradient: 'from-blue-500/10 to-blue-600/5 border-blue-500/20' },
  'DASHBOARD': { icon: '📊', gradient: 'from-purple-500/10 to-purple-600/5 border-purple-500/20' },
  'SUPPORT': { icon: '🛠️', gradient: 'from-green-500/10 to-green-600/5 border-green-500/20' },
  'LMS': { icon: '📚', gradient: 'from-amber-500/10 to-amber-600/5 border-amber-500/20' },
  'CPAY': { icon: '💳', gradient: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20' },
  'EDUMALLS': { icon: '🎓', gradient: 'from-pink-500/10 to-pink-600/5 border-pink-500/20' },
};

export default function NewTicket() {
  const { user, profile, role } = useAuth();
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
  const selectedSystem = systems.find(s => s.id === systemId);
  const selectedService = services.find(s => s.id === serviceId);
  const selectedCategory = categories.find(c => c.id === categoryId);

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

  // AI suggestion for service
  const requestAiSuggestion = async () => {
    if (!title.trim()) return;
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      // Fetch both suggestions in parallel
      const [suggestRes, classifyRes] = await Promise.all([
        supabase.functions.invoke('suggest-service', {
          body: { title: title.trim(), description: description.trim() },
        }),
        supabase.functions.invoke('classify-ticket', {
          body: { title: title.trim(), description: description.trim() },
        }),
      ]);

      if (suggestRes.data?.suggestion) {
        setAiSuggestion(suggestRes.data.suggestion);
      }

      // Auto-apply classification (priority)
      if (classifyRes.data?.classification) {
        const cls = classifyRes.data.classification;
        if (cls.priority) setPriority(cls.priority);
        if (cls.category_id) setCategoryId(cls.category_id);
        toast({
          title: 'تصنيف ذكي ✨',
          description: `${cls.reason || 'تم تحديد الأولوية والتصنيف تلقائياً'}`,
        });
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
        const { data: signedData } = await supabase.storage.from('ticket-attachments').createSignedUrl(filePath, 60 * 60 * 24 * 365);
        const fileUrl = signedData?.signedUrl || filePath;
        await addAttachment({
          ticket_id: ticket.id,
          uploaded_by: user!.id,
          file_name: file.name,
          file_url: fileUrl,
          file_size: file.size,
        });
      }
      return ticket;
    },
    onSuccess: () => {
      toast({ title: 'تم إنشاء التذكرة بنجاح 🎉' });
      navigate('/tickets');
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: sanitizeError(err), variant: 'destructive' });
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

  const roleLabel = role === 'admin' ? 'مشرف' : role === 'agent' ? 'دعم فني' : role === 'developer' ? 'مطور' : 'عميل';

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
              {/* Requester Info Card */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-xl border bg-card p-4"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{profile?.full_name || 'مستخدم'}</h3>
                      <Badge variant="outline" className="text-xs">{roleLabel}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {profile?.email || user?.email}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      مقدّم الطلب
                    </span>
                  </div>
                </div>
              </motion.div>

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
                          {/* Ticket Templates */}
                          <TicketTemplatesPicker onSelect={(t) => { setTitle(t.title); setDescription(t.description); setPriority(t.priority); }} />
                          
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
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {priorities.map(p => (
                                <button
                                  key={p.value}
                                  type="button"
                                  onClick={() => setPriority(p.value)}
                                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                                    priority === p.value
                                      ? `${p.color} ring-2 ring-offset-1 ring-current`
                                      : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
                                  }`}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 1: Service Catalog - Hierarchical */}
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
                                    <Button size="sm" onClick={applyAiSuggestion} className="gap-1.5">
                                      تطبيق الاقتراح
                                    </Button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          )}

                          {/* Breadcrumb for selection */}
                          {(systemId || serviceId || categoryId) && (
                            <div className="flex items-center gap-1 text-sm flex-wrap">
                              {selectedSystem && (
                                <button
                                  onClick={() => { setSystemId(''); setServiceId(''); setCategoryId(''); }}
                                  className="text-primary hover:underline font-medium"
                                >
                                  {selectedSystem.name}
                                </button>
                              )}
                              {selectedService && (
                                <>
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground rtl:rotate-180" />
                                  <button
                                    onClick={() => { setServiceId(''); setCategoryId(''); }}
                                    className="text-primary hover:underline font-medium"
                                  >
                                    {selectedService.name}
                                  </button>
                                </>
                              )}
                              {selectedCategory && (
                                <>
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground rtl:rotate-180" />
                                  <span className="text-foreground font-medium">{selectedCategory.name}</span>
                                </>
                              )}
                            </div>
                          )}

                          {/* Step 1a: Select System */}
                          {!systemId && (
                            <div className="space-y-3">
                              <Label className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" />
                                اختر النظام
                              </Label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {systems.map(sys => {
                                  const style = systemStyles[sys.code] || { icon: '📦', gradient: 'from-gray-500/10 to-gray-600/5 border-gray-500/20' };
                                  return (
                                    <motion.button
                                      key={sys.id}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => { setSystemId(sys.id); setServiceId(''); setCategoryId(''); setAiSuggestion(null); }}
                                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border bg-gradient-to-br ${style.gradient} hover:shadow-md transition-all text-center`}
                                    >
                                      <span className="text-2xl">{style.icon}</span>
                                      <span className="text-sm font-semibold text-foreground">{sys.name}</span>
                                      {sys.description && (
                                        <span className="text-xs text-muted-foreground line-clamp-1">{sys.description}</span>
                                      )}
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Step 1b: Select Service (Module) */}
                          {systemId && !serviceId && (
                            <div className="space-y-3">
                              <Label className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-primary" />
                                اختر الموديول / الخدمة
                              </Label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {filteredServices.map(svc => (
                                  <motion.button
                                    key={svc.id}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => { setServiceId(svc.id); setCategoryId(''); }}
                                    className="flex items-center gap-3 p-3.5 rounded-xl border bg-card hover:bg-accent/5 hover:border-primary/30 transition-all text-right"
                                  >
                                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                      <Layers className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-foreground">{svc.name}</p>
                                      {svc.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{svc.description}</p>
                                      )}
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 rtl:rotate-180" />
                                  </motion.button>
                                ))}
                              </div>
                              {filteredServices.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-6">لا توجد خدمات متاحة لهذا النظام</p>
                              )}
                            </div>
                          )}

                          {/* Step 1c: Select Category (Screen) */}
                          {serviceId && !categoryId && categories.length > 0 && (
                            <div className="space-y-3">
                              <Label className="flex items-center gap-2">
                                <Monitor className="h-4 w-4 text-primary" />
                                اختر الشاشة
                              </Label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {categories.map(cat => (
                                  <motion.button
                                    key={cat.id}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => setCategoryId(cat.id)}
                                    className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/5 hover:border-primary/30 transition-all text-right"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                                      <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground">{cat.name}</p>
                                      {cat.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-1">{cat.description}</p>
                                      )}
                                    </div>
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Selection summary when complete */}
                          {serviceId && (categoryId || categories.length === 0) && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2"
                            >
                              <p className="text-sm font-semibold text-primary flex items-center gap-2">
                                ✅ تم تحديد الخدمة
                              </p>
                              <div className="flex items-center gap-2 text-sm text-foreground flex-wrap">
                                {selectedSystem && <Badge variant="outline">{selectedSystem.name}</Badge>}
                                {selectedService && <Badge variant="outline">{selectedService.name}</Badge>}
                                {selectedCategory && <Badge variant="outline">{selectedCategory.name}</Badge>}
                              </div>
                            </motion.div>
                          )}

                          {/* Dynamic service fields */}
                          {serviceFields.length > 0 && serviceId && (
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
                        className="gap-1.5"
                      >
                        التالي
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={mutation.isPending}
                        className="gap-1.5"
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
