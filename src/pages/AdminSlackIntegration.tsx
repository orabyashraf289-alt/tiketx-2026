import { useState } from 'react';
import { PageLayout, PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { MessageSquare, Send, CheckCircle, XCircle, Hash, Bell, Zap, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';

export default function AdminSlackIntegration() {
  const [testChannel, setTestChannel] = useState('#general');
  const [testMessage, setTestMessage] = useState('🔔 رسالة تجريبية من نظام التذاكر');
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; error?: string } | null>(null);

  const sendTestMessage = async () => {
    setSending(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('send-slack-notification', {
        body: {
          channel: testChannel,
          message: testMessage,
          ticket: {
            ticket_number: 9999,
            title: 'تذكرة تجريبية',
            priority: 'high',
            status: 'new',
            source_system: 'PORTAL',
          },
        },
      });
      if (error) throw error;
      if (data?.success) {
        setLastResult({ success: true });
        toast({ title: 'تم الإرسال بنجاح ✅' });
      } else {
        throw new Error(data?.error || 'فشل الإرسال');
      }
    } catch (err: any) {
      setLastResult({ success: false, error: err.message });
      toast({ title: 'فشل الإرسال', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const notificationEvents = [
    { event: 'تذكرة جديدة', description: 'عند إنشاء تذكرة جديدة', icon: Bell },
    { event: 'تغيير حالة', description: 'عند تغيير حالة التذكرة', icon: Zap },
    { event: 'تذكرة عاجلة', description: 'عند إنشاء تذكرة بأولوية عاجلة', icon: AlertTriangle },
    { event: 'تذكرة خارجية', description: 'عند استقبال تذكرة من نظام خارجي', icon: MessageSquare },
  ];

  return (
    <PageLayout>
      <PageHeader
        title="تكامل Slack"
        icon={<MessageSquare className="h-4 w-4" />}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Connection Status */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="rounded-2xl border-primary/20 bg-primary/5">
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-[#4A154B] flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="font-bold text-foreground">Slack Integration</h2>
                        <p className="text-xs text-muted-foreground">
                          إرسال إشعارات التذاكر تلقائياً إلى قنوات Slack
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      يمكنك ربط Slack لإرسال إشعارات فورية عند إنشاء التذاكر أو تغيير حالتها.
                      استخدم قواعد الأتمتة لتخصيص الإشعارات لكل قناة.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Test Section */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Send className="h-4 w-4 text-primary" />
                      اختبار الإرسال
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">القناة</Label>
                        <div className="relative mt-1">
                          <Hash className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            dir="ltr"
                            value={testChannel}
                            onChange={(e) => setTestChannel(e.target.value)}
                            placeholder="#general"
                            className="pr-8"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">الرسالة</Label>
                        <Textarea
                          value={testMessage}
                          onChange={(e) => setTestMessage(e.target.value)}
                          rows={2}
                          className="mt-1 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button onClick={sendTestMessage} disabled={sending} size="sm">
                        <Send className="h-3.5 w-3.5 ml-1" />
                        {sending ? 'جاري الإرسال...' : 'إرسال رسالة تجريبية'}
                      </Button>
                      {lastResult && (
                        <div className="flex items-center gap-1.5 text-xs">
                          {lastResult.success ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-success" />
                              <span className="text-success">تم الإرسال بنجاح</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-destructive" />
                              <span className="text-destructive">{lastResult.error}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Automation Events */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      أحداث الإشعارات المدعومة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {notificationEvents.map((item) => (
                        <div key={item.event} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/30 transition-colors">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <item.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.event}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">قابل للتخصيص</Badge>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      💡 يمكنك تخصيص هذه الأحداث من صفحة <strong>سير العمل التلقائي</strong> باختيار إجراء "إرسال لـ Slack"
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
      </main>
    </PageLayout>
  );
}
