import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Inbox, Clock, CheckCircle2, AlertTriangle, Shield, Timer,
  TrendingUp, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useLanguage } from '@/i18n';

interface Props {
  stats: any;
  report: any;
  tickets: any[];
  unresolvedCount: number;
  pendingCount: number;
}

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export const DashboardKPICards = memo(function DashboardKPICards({ stats, report, tickets, unresolvedCount, pendingCount }: Props) {
  const { t, lang } = useLanguage();
  const resolvedCount = stats?.resolved ?? 0;
  const resolutionRate = tickets.length > 0 ? Math.round((resolvedCount / tickets.length) * 100) : 0;
  const slaCompliance = report?.slaCompliancePercent ?? 0;

  const kpis = [
    {
      title: t.dashboard.unresolvedTickets,
      value: unresolvedCount,
      icon: Inbox,
      color: 'destructive' as const,
      trend: unresolvedCount > 10 ? 'up' : 'down',
      trendLabel: unresolvedCount > 10 ? (lang === 'ar' ? 'يحتاج متابعة' : 'Needs attention') : (lang === 'ar' ? 'جيد' : 'Good'),
    },
    {
      title: t.dashboard.pending,
      value: pendingCount,
      icon: Clock,
      color: 'warning' as const,
      trend: pendingCount > 5 ? 'up' : 'down',
      trendLabel: `${pendingCount} ${lang === 'ar' ? 'بانتظار' : 'waiting'}`,
    },
    {
      title: lang === 'ar' ? 'تم الحل' : 'Resolved',
      value: resolvedCount,
      icon: CheckCircle2,
      color: 'success' as const,
      trend: 'down' as const,
      trendLabel: `${resolutionRate}% ${lang === 'ar' ? 'معدل الحل' : 'rate'}`,
    },
    {
      title: t.dashboard.slaCompliance,
      value: `${slaCompliance}%`,
      icon: Shield,
      color: slaCompliance >= 80 ? 'success' as const : 'destructive' as const,
      trend: slaCompliance >= 80 ? 'down' : 'up',
      trendLabel: slaCompliance >= 80 ? (lang === 'ar' ? 'ممتاز' : 'Excellent') : (lang === 'ar' ? 'يحتاج تحسين' : 'Needs improvement'),
    },
    {
      title: t.dashboard.avgFirstResponse,
      value: `${report?.avgFirstResponseHours ?? 0}h`,
      icon: Timer,
      color: 'info' as const,
      trend: (report?.avgFirstResponseHours ?? 0) <= 4 ? 'down' : 'up',
      trendLabel: (report?.avgFirstResponseHours ?? 0) <= 4 ? (lang === 'ar' ? 'سريع' : 'Fast') : (lang === 'ar' ? 'بطيء' : 'Slow'),
    },
    {
      title: lang === 'ar' ? 'إجمالي التذاكر' : 'Total Tickets',
      value: tickets.length,
      icon: BarChart3,
      color: 'primary' as const,
      trend: 'neutral' as const,
      trendLabel: `${stats?.new ?? 0} ${lang === 'ar' ? 'جديدة' : 'new'}`,
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.title}
          variants={item}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="group relative rounded-2xl bg-card border border-border/50 p-4 cursor-default overflow-hidden hover:shadow-card-hover hover:border-primary/20 transition-all duration-300"
        >
          {/* Background accent */}
          <div className={`absolute inset-0 bg-${kpi.color}/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-${kpi.color}/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <kpi.icon className={`h-4.5 w-4.5 text-${kpi.color}`} />
              </div>
              <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                kpi.trend === 'up' ? 'text-destructive' : kpi.trend === 'down' ? 'text-success' : 'text-muted-foreground'
              }`}>
                {kpi.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : kpi.trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> : null}
              </div>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="text-2xl font-bold text-foreground mb-0.5"
            >
              {kpi.value}
            </motion.p>

            <p className="text-[10px] text-muted-foreground font-medium leading-tight">{kpi.title}</p>

            <p className={`text-[9px] mt-1.5 font-medium ${
              kpi.trend === 'up' ? 'text-destructive/70' : kpi.trend === 'down' ? 'text-success/70' : 'text-muted-foreground/70'
            }`}>
              {kpi.trendLabel}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
});
