import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout, PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/i18n';
import { toast } from 'sonner';
import {
  MessageSquare, Phone, Mail, Globe, Plus, Settings, Activity,
  ArrowUpRight, ArrowDownLeft, CheckCircle2, XCircle, Clock,
  Smartphone, Monitor, Zap, BarChart3, TrendingUp, Users,
  MessageCircle, Send, Bot, Sparkles, Hash
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const channels = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    icon: MessageCircle,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500/20',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    status: 'active' as const,
    incoming: 156,
    outgoing: 89,
    responseTime: '2.3 min',
    satisfaction: 94,
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    icon: Hash,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500/20',
    gradient: 'from-blue-500/10 to-blue-600/5',
    status: 'active' as const,
    incoming: 89,
    outgoing: 45,
    responseTime: '4.1 min',
    satisfaction: 91,
  },
  {
    id: 'email',
    name: 'Email',
    icon: Mail,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500/20',
    gradient: 'from-amber-500/10 to-amber-600/5',
    status: 'active' as const,
    incoming: 234,
    outgoing: 198,
    responseTime: '12.5 min',
    satisfaction: 87,
  },
  {
    id: 'portal',
    name: 'Customer Portal',
    icon: Globe,
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-500/20',
    gradient: 'from-purple-500/10 to-purple-600/5',
    status: 'active' as const,
    incoming: 312,
    outgoing: 0,
    responseTime: '—',
    satisfaction: 89,
  },
  {
    id: 'sms',
    name: 'SMS',
    icon: Smartphone,
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    borderColor: 'border-rose-500/20',
    gradient: 'from-rose-500/10 to-rose-600/5',
    status: 'inactive' as const,
    incoming: 0,
    outgoing: 0,
    responseTime: '—',
    satisfaction: 0,
  },
  {
    id: 'chatbot',
    name: 'AI Chatbot',
    icon: Bot,
    color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    borderColor: 'border-cyan-500/20',
    gradient: 'from-cyan-500/10 to-cyan-600/5',
    status: 'active' as const,
    incoming: 567,
    outgoing: 512,
    responseTime: '0.3 sec',
    satisfaction: 82,
  },
];

const recentMessages = [
  { id: 1, channel: 'whatsapp', from: 'أحمد محمد', message: 'مشكلة في تسجيل الدخول إلى النظام', time: 'قبل 2 دقيقة', status: 'new' },
  { id: 2, channel: 'teams', from: 'سارة علي', message: 'طلب صلاحيات جديدة للنظام المالي', time: 'قبل 5 دقائق', status: 'assigned' },
  { id: 3, channel: 'email', from: 'خالد الأحمد', message: 'تقرير الأداء لا يعمل بشكل صحيح', time: 'قبل 10 دقائق', status: 'in_progress' },
  { id: 4, channel: 'whatsapp', from: 'فاطمة حسن', message: 'شكراً تم حل المشكلة', time: 'قبل 15 دقيقة', status: 'resolved' },
  { id: 5, channel: 'chatbot', from: 'زائر', message: 'كيف يمكنني إعادة تعيين كلمة المرور؟', time: 'قبل 20 دقيقة', status: 'auto_resolved' },
];

export default function AdminChannels() {
  const { lang } = useLanguage();
  const [showSetup, setShowSetup] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const isAr = lang === 'ar';

  const totalIncoming = channels.reduce((s, c) => s + c.incoming, 0);
  const totalOutgoing = channels.reduce((s, c) => s + c.outgoing, 0);
  const activeChannels = channels.filter(c => c.status === 'active').length;

  const statusColors: Record<string, string> = {
    new: 'bg-primary/10 text-primary',
    assigned: 'bg-info/10 text-info',
    in_progress: 'bg-warning/10 text-warning',
    resolved: 'bg-success/10 text-success',
    auto_resolved: 'bg-accent/10 text-accent-foreground',
  };

  const channelIcons: Record<string, any> = {
    whatsapp: MessageCircle,
    teams: Hash,
    email: Mail,
    chatbot: Bot,
  };

  return (
    <PageLayout>
      <PageHeader title={isAr ? 'القنوات المتعددة' : 'Omni-Channel'} />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="max-w-7xl mx-auto space-y-6">

          {/* KPI Row */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: isAr ? 'القنوات النشطة' : 'Active Channels', value: activeChannels, icon: Activity, color: 'text-success' },
              { label: isAr ? 'رسائل واردة' : 'Incoming', value: totalIncoming, icon: ArrowDownLeft, color: 'text-info' },
              { label: isAr ? 'رسائل صادرة' : 'Outgoing', value: totalOutgoing, icon: ArrowUpRight, color: 'text-primary' },
              { label: isAr ? 'معدل الرد' : 'Avg Response', value: '4.2 min', icon: Clock, color: 'text-warning' },
            ].map((kpi, i) => (
              <Card key={i} className="rounded-2xl border-border/50 shadow-card hover:shadow-card-hover transition-all duration-300">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center ${kpi.color}`}>
                    <kpi.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                    <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Channels Grid */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">{isAr ? 'قنوات الاتصال' : 'Communication Channels'}</h2>
              <Dialog open={showSetup} onOpenChange={setShowSetup}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 rounded-xl">
                    <Plus className="h-4 w-4" />
                    {isAr ? 'إضافة قناة' : 'Add Channel'}
                  </Button>
                </DialogTrigger>
                <DialogContent dir={isAr ? 'rtl' : 'ltr'}>
                  <DialogHeader>
                    <DialogTitle>{isAr ? 'إعداد قناة جديدة' : 'Setup New Channel'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>{isAr ? 'نوع القناة' : 'Channel Type'}</Label>
                      <Select onValueChange={v => setSelectedChannel(v)}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder={isAr ? 'اختر القناة' : 'Select channel'} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="whatsapp">WhatsApp Business API</SelectItem>
                          <SelectItem value="teams">Microsoft Teams</SelectItem>
                          <SelectItem value="telegram">Telegram Bot</SelectItem>
                          <SelectItem value="sms">SMS (Twilio)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedChannel === 'whatsapp' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>WhatsApp Business Phone Number ID</Label>
                          <Input placeholder="e.g. 1234567890" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Access Token</Label>
                          <Input type="password" placeholder="Bearer token" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Webhook Verify Token</Label>
                          <Input placeholder="Custom verify token" className="rounded-xl" />
                        </div>
                      </div>
                    )}
                    {selectedChannel === 'teams' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Azure Bot App ID</Label>
                          <Input placeholder="Application ID" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>App Secret</Label>
                          <Input type="password" placeholder="Client Secret" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Teams Webhook URL</Label>
                          <Input placeholder="https://..." className="rounded-xl" />
                        </div>
                      </div>
                    )}
                    <Button className="w-full rounded-xl" onClick={() => { setShowSetup(false); toast.success(isAr ? 'تم حفظ إعداد القناة' : 'Channel configuration saved'); }}>
                      <Zap className="h-4 w-4 me-2" />
                      {isAr ? 'حفظ وتفعيل' : 'Save & Activate'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.map((ch, i) => (
                <motion.div
                  key={ch.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card className={`rounded-2xl border-border/50 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group`}>
                    <div className={`h-1 w-full bg-gradient-to-r ${ch.gradient}`} />
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${ch.color} flex items-center justify-center`}>
                            <ch.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground">{ch.name}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {ch.status === 'active' ? (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-success/30 text-success bg-success/5">
                                  <CheckCircle2 className="h-2.5 w-2.5 me-0.5" />
                                  {isAr ? 'نشط' : 'Active'}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-muted-foreground/30 text-muted-foreground">
                                  <XCircle className="h-2.5 w-2.5 me-0.5" />
                                  {isAr ? 'غير مفعل' : 'Inactive'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-muted/40 p-2.5 text-center">
                          <p className="text-lg font-bold text-foreground">{ch.incoming}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                            <ArrowDownLeft className="h-2.5 w-2.5" /> {isAr ? 'وارد' : 'In'}
                          </p>
                        </div>
                        <div className="rounded-xl bg-muted/40 p-2.5 text-center">
                          <p className="text-lg font-bold text-foreground">{ch.outgoing}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                            <ArrowUpRight className="h-2.5 w-2.5" /> {isAr ? 'صادر' : 'Out'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {ch.responseTime}</span>
                        {ch.satisfaction > 0 && (
                          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-success" /> {ch.satisfaction}%</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Messages Feed */}
          <motion.div variants={fadeUp}>
            <Card className="rounded-2xl border-border/50 shadow-card overflow-hidden">
              <CardHeader className="border-b border-border/40">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  {isAr ? 'آخر الرسائل عبر القنوات' : 'Recent Cross-Channel Messages'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {recentMessages.map((msg, i) => {
                    const ChIcon = channelIcons[msg.channel] || Globe;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: isAr ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="flex items-center gap-3 p-3.5 hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                          <ChIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{msg.from}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${statusColors[msg.status] || ''}`}>
                              {msg.status === 'auto_resolved' ? (isAr ? 'حل تلقائي' : 'Auto') : msg.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.message}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">{msg.time}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </PageLayout>
  );
}
