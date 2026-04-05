import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { Globe, Copy, CheckCircle, Code, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/receive-external-ticket`;

const examplePayload = {
  source_system: "ERP",
  title: "طلب صيانة نظام ERP",
  description: "يرجى إصلاح مشكلة في نظام الفوترة",
  priority: "high",
  requester_email: "user@example.com",
  requester_name: "أحمد محمد",
  external_reference: "ERP-INV-2024-001",
  service_name: "صيانة الأنظمة",
  category_name: "أعطال",
  external_payload: {
    invoice_id: "INV-001",
    module: "billing"
  }
};

const exampleCurl = `curl -X POST "${API_BASE}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "x-api-key: YOUR_EXTERNAL_API_KEY" \\
  -d '${JSON.stringify(examplePayload, null, 2)}'`;

const exampleResponse = {
  success: true,
  ticket: {
    id: "uuid-here",
    ticket_number: 1042,
    code: "TCK-2026-001042",
    status: "new",
    priority: "high",
    created_at: "2026-03-03T12:00:00.000Z"
  }
};

function CodeBlock({ code, language = 'json' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: 'تم النسخ ✅' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-muted/70 rounded-xl p-4 text-xs overflow-x-auto border" dir="ltr">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 left-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? <CheckCircle className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

export default function AdminExternalAPI() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 gap-3 shrink-0 sticky top-0 z-30"
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <Globe className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">واجهة API الخارجية</h1>
            </div>
            <NotificationsPopover />
          </motion.header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Overview */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="rounded-2xl border-primary/20 bg-primary/5">
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="h-5 w-5 text-primary" />
                      <h2 className="font-bold text-foreground">استقبال التذاكر من الأنظمة الخارجية</h2>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      يمكنك إرسال تذاكر من أنظمة ERP, LMS, CPAY وغيرها عبر هذه الواجهة البرمجية. 
                      سيتم إنشاء التذكرة تلقائياً مع ربطها بالخدمة والتصنيف المناسب.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Endpoint */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Code className="h-4 w-4 text-primary" />
                      نقطة النهاية (Endpoint)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-success/20 text-success text-xs font-bold px-2 py-1 rounded">POST</span>
                      <code className="text-xs bg-muted px-3 py-1.5 rounded-lg flex-1 overflow-x-auto" dir="ltr">
                        {API_BASE}
                      </code>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground">الهيدرات المطلوبة:</p>
                      <div className="text-xs space-y-1 text-muted-foreground" dir="ltr">
                        <p><code className="bg-muted px-1.5 py-0.5 rounded">Content-Type: application/json</code></p>
                        <p><code className="bg-muted px-1.5 py-0.5 rounded">apikey: YOUR_ANON_KEY</code></p>
                        <p><code className="bg-muted px-1.5 py-0.5 rounded">x-api-key: YOUR_EXTERNAL_API_KEY</code> (اختياري)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Request / Response Examples */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm">أمثلة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="payload" dir="rtl">
                      <TabsList className="rounded-xl mb-4">
                        <TabsTrigger value="payload" className="rounded-lg text-xs">محتوى الطلب</TabsTrigger>
                        <TabsTrigger value="curl" className="rounded-lg text-xs">cURL</TabsTrigger>
                        <TabsTrigger value="response" className="rounded-lg text-xs">الاستجابة</TabsTrigger>
                      </TabsList>
                      <TabsContent value="payload">
                        <CodeBlock code={JSON.stringify(examplePayload, null, 2)} />
                      </TabsContent>
                      <TabsContent value="curl">
                        <CodeBlock code={exampleCurl} language="bash" />
                      </TabsContent>
                      <TabsContent value="response">
                        <CodeBlock code={JSON.stringify(exampleResponse, null, 2)} />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Fields Reference */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm">مرجع الحقول</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-right p-2 font-semibold">الحقل</th>
                            <th className="text-right p-2 font-semibold">النوع</th>
                            <th className="text-right p-2 font-semibold">مطلوب</th>
                            <th className="text-right p-2 font-semibold">الوصف</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ['source_system', 'string', '✅', 'ERP | LMS | CPAY | PORTAL'],
                            ['title', 'string', '✅', 'عنوان التذكرة'],
                            ['description', 'string', '✅', 'وصف المشكلة'],
                            ['requester_email', 'string', '✅', 'بريد مقدم الطلب'],
                            ['priority', 'string', '❌', 'low | medium | high | urgent'],
                            ['requester_name', 'string', '❌', 'اسم مقدم الطلب'],
                            ['external_reference', 'string', '❌', 'رقم مرجعي من النظام المصدر'],
                            ['service_name', 'string', '❌', 'اسم الخدمة (للربط التلقائي)'],
                            ['category_name', 'string', '❌', 'اسم التصنيف'],
                            ['external_payload', 'object', '❌', 'بيانات إضافية من النظام المصدر'],
                          ].map(([field, type, required, desc]) => (
                            <tr key={field} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="p-2 font-mono" dir="ltr">{field}</td>
                              <td className="p-2">{type}</td>
                              <td className="p-2 text-center">{required}</td>
                              <td className="p-2">{desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
