import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/receive-external-ticket`;

export function ApiTestPlayground() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: number; body: any } | null>(null);
  const [form, setForm] = useState({
    source_system: 'ERP',
    title: '',
    description: '',
    priority: 'medium',
    requester_email: '',
    requester_name: '',
    external_reference: '',
  });

  const runTest = async () => {
    if (!form.title || !form.description || !form.requester_email) {
      toast({ title: 'يرجى تعبئة الحقول المطلوبة', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const payload: any = { ...form };
      // Remove empty optional fields
      Object.keys(payload).forEach((k) => {
        if (!payload[k]) delete payload[k];
      });

      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      setResult({ status: res.status, body });
      if (res.ok) {
        toast({ title: 'تم إنشاء التذكرة بنجاح ✅' });
      }
    } catch (err: any) {
      setResult({ status: 0, body: { error: err.message } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <Card className="rounded-2xl border-primary/20">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            ساحة الاختبار (API Playground)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">النظام المصدر *</Label>
              <Select value={form.source_system} onValueChange={(v) => setForm((f) => ({ ...f, source_system: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ERP">ERP</SelectItem>
                  <SelectItem value="LMS">LMS</SelectItem>
                  <SelectItem value="CPAY">CPAY</SelectItem>
                  <SelectItem value="PORTAL">PORTAL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">الأولوية</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="urgent">عاجلة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">عنوان التذكرة *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="مثال: عطل في نظام الفوترة"
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">الوصف *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="وصف المشكلة بالتفصيل..."
                rows={2}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">بريد مقدم الطلب *</Label>
              <Input
                dir="ltr"
                value={form.requester_email}
                onChange={(e) => setForm((f) => ({ ...f, requester_email: e.target.value }))}
                placeholder="user@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">اسم مقدم الطلب</Label>
              <Input
                value={form.requester_name}
                onChange={(e) => setForm((f) => ({ ...f, requester_name: e.target.value }))}
                placeholder="اختياري"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">مرجع خارجي</Label>
              <Input
                dir="ltr"
                value={form.external_reference}
                onChange={(e) => setForm((f) => ({ ...f, external_reference: e.target.value }))}
                placeholder="ERP-INV-001"
                className="mt-1"
              />
            </div>
          </div>

          <Button onClick={runTest} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Play className="h-4 w-4 ml-1" />}
            {loading ? 'جاري الإرسال...' : 'إرسال طلب تجريبي'}
          </Button>

          {result && (
            <div className="rounded-xl border p-3 space-y-2">
              <div className="flex items-center gap-2">
                {result.status >= 200 && result.status < 300 ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <Badge variant={result.status >= 200 && result.status < 300 ? 'default' : 'destructive'}>
                  HTTP {result.status}
                </Badge>
              </div>
              <pre className="bg-muted/70 rounded-lg p-3 text-xs overflow-x-auto" dir="ltr">
                <code>{JSON.stringify(result.body, null, 2)}</code>
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
