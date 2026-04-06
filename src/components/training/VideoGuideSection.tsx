import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Play, Clock, BookOpen, Users, Shield, Plug, Zap, BarChart3, Settings, Star, Video } from 'lucide-react';

interface VideoGuide {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: React.ReactNode;
  color: string;
  videoUrl: string;
}

const VIDEO_GUIDES: VideoGuide[] = [
  {
    id: 'system-overview',
    title: 'نظرة عامة على النظام',
    description: 'تعرف على لوحة التحكم وإدارة التذاكر وسير الموافقات في فيديو واحد',
    duration: '20 ثانية',
    icon: <BookOpen className="h-5 w-5" />,
    color: 'from-primary to-[hsl(var(--accent-foreground))]',
    videoUrl: '/__l5e/assets-v1/886408c0-eb33-4d7f-9c30-df3b769b3b59/hero-training.mp4',
  },
  {
    id: 'course-1',
    title: 'أساسيات نظام التذاكر',
    description: 'تعلم كيفية إنشاء ومتابعة وإدارة التذاكر باحترافية',
    duration: '11 ثانية',
    icon: <BookOpen className="h-5 w-5" />,
    color: 'from-indigo-500 to-cyan-500',
    videoUrl: '/__l5e/assets-v1/43561df2-b838-47e6-95fb-49cfcb1f8d51/course-tickets.mp4',
  },
  {
    id: 'course-2',
    title: 'إدارة فريق الدعم',
    description: 'توزيع المهام وإدارة أداء الفريق بكفاءة',
    duration: '11 ثانية',
    icon: <Users className="h-5 w-5" />,
    color: 'from-violet-500 to-pink-500',
    videoUrl: '/__l5e/assets-v1/c7cdb287-7e53-4f72-a0e8-093e9b73710d/course-team.mp4',
  },
  {
    id: 'course-3',
    title: 'تكوين سياسات SLA',
    description: 'ضمان جودة الخدمة والاستجابة في الوقت المحدد',
    duration: '11 ثانية',
    icon: <Shield className="h-5 w-5" />,
    color: 'from-amber-500 to-red-500',
    videoUrl: '/__l5e/assets-v1/c6070eab-e0f9-4d44-9aa8-02a5a5cb2b98/course-sla.mp4',
  },
  {
    id: 'course-4',
    title: 'تكامل كلاسيرا المتقدم',
    description: 'ربط الأنظمة ومزامنة البيانات تلقائياً',
    duration: '11 ثانية',
    icon: <Plug className="h-5 w-5" />,
    color: 'from-emerald-500 to-cyan-500',
    videoUrl: '/__l5e/assets-v1/16476644-7c9a-48a9-9b23-257fba76c26b/course-integration.mp4',
  },
  {
    id: 'course-5',
    title: 'سير العمل والأتمتة',
    description: 'أتمتة العمليات المتكررة وتوفير الوقت',
    duration: '11 ثانية',
    icon: <Zap className="h-5 w-5" />,
    color: 'from-orange-500 to-yellow-500',
    videoUrl: '/__l5e/assets-v1/6001e3bb-5c8f-40c9-aff4-7cbcc95180b5/course-automation.mp4',
  },
  {
    id: 'course-6',
    title: 'التقارير والتحليلات',
    description: 'رؤى تحليلية عميقة لاتخاذ قرارات أفضل',
    duration: '11 ثانية',
    icon: <BarChart3 className="h-5 w-5" />,
    color: 'from-blue-500 to-violet-500',
    videoUrl: '/__l5e/assets-v1/fa4f9bbb-6899-4f14-98e5-edb7dc7ab2fe/course-reports.mp4',
  },
  {
    id: 'course-7',
    title: 'إعدادات النظام والأمان',
    description: 'حماية البيانات وضبط الإعدادات المتقدمة',
    duration: '11 ثانية',
    icon: <Settings className="h-5 w-5" />,
    color: 'from-red-500 to-orange-500',
    videoUrl: '/__l5e/assets-v1/605cbf81-ef44-432e-ab02-bff7d6da4254/course-security.mp4',
  },
  {
    id: 'course-8',
    title: 'إدارة Multi-Tenant',
    description: 'إدارة عدة مؤسسات من منصة واحدة',
    duration: '11 ثانية',
    icon: <Star className="h-5 w-5" />,
    color: 'from-purple-500 to-pink-500',
    videoUrl: '/__l5e/assets-v1/a49b008b-28e5-4897-ad1e-f70095ca1d17/course-tenant.mp4',
  },
];

export function VideoGuideSection() {
  const [activeVideo, setActiveVideo] = useState<VideoGuide | null>(null);

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">أدلة الفيديو التعليمية</h2>
          <Badge variant="outline" className="text-[10px] gap-1 border-primary/20 text-primary">
            AI Generated
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {VIDEO_GUIDES.map((guide, i) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card
                className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20"
                onClick={() => setActiveVideo(guide)}
              >
                <div className="relative w-full aspect-video bg-muted overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${guide.color} opacity-20 flex items-center justify-center`}>
                    <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="h-6 w-6 text-primary-foreground mr-[-2px]" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 text-[11px] text-foreground/70">
                    <span className="flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
                      <Clock className="h-3 w-3" /> {guide.duration}
                    </span>
                  </div>
                </div>

                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                      {guide.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {guide.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{guide.description}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs h-9 mt-2">
                    <Play className="h-3.5 w-3.5" /> مشاهدة الدليل
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-base">{activeVideo?.title}</DialogTitle>
          </DialogHeader>
          <div className="w-full bg-black">
            {activeVideo && (
              <video
                controls
                autoPlay
                className="w-full max-h-[70vh]"
                src={activeVideo.videoUrl}
              >
                متصفحك لا يدعم تشغيل الفيديو
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
