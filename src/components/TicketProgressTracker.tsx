import { motion } from 'framer-motion';
import { Check, Circle, Clock, MessageSquare, AlertTriangle, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const TICKET_STAGES = [
  { key: 'new', label: 'جديدة', icon: Circle, description: 'تم استلام التذكرة' },
  { key: 'open', label: 'مفتوحة', icon: Clock, description: 'قيد المراجعة' },
  { key: 'in_progress', label: 'قيد المعالجة', icon: MessageSquare, description: 'يعمل عليها فريق الدعم' },
  { key: 'resolved', label: 'محلولة', icon: CheckCircle2, description: 'تم حل المشكلة' },
  { key: 'closed', label: 'مغلقة', icon: Check, description: 'تم إغلاق التذكرة' },
];

const SPECIAL_STATUSES: Record<string, { label: string; icon: typeof AlertTriangle; color: string }> = {
  waiting_on_customer: { label: 'بانتظار ردك', icon: AlertTriangle, color: 'text-orange-500' },
  reopened: { label: 'أعيد فتحها', icon: RotateCcw, color: 'text-rose-500' },
};

interface TicketProgressTrackerProps {
  status: string;
  className?: string;
  compact?: boolean;
}

export function TicketProgressTracker({ status, className, compact = false }: TicketProgressTrackerProps) {
  // Handle special statuses
  const specialStatus = SPECIAL_STATUSES[status];
  
  // Map status to stage index
  const getStageIndex = (s: string): number => {
    const idx = TICKET_STAGES.findIndex(st => st.key === s);
    if (idx !== -1) return idx;
    if (s === 'waiting_on_customer') return 2; // Between in_progress and resolved
    if (s === 'reopened') return 1; // Back to open
    return 0;
  };

  const currentIndex = getStageIndex(status);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {TICKET_STAGES.map((stage, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={stage.key} className="flex items-center gap-1">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all",
                  isCompleted && "bg-emerald-500",
                  isCurrent && "bg-primary ring-2 ring-primary/30",
                  !isCompleted && !isCurrent && "bg-muted-foreground/20"
                )}
              />
              {i < TICKET_STAGES.length - 1 && (
                <div className={cn(
                  "h-0.5 w-4 rounded transition-all",
                  isCompleted ? "bg-emerald-500" : "bg-muted-foreground/20"
                )} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Special status alert */}
      {specialStatus && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2 mb-3"
        >
          <specialStatus.icon className={cn("h-4 w-4 shrink-0", specialStatus.color)} />
          <span className={cn("text-sm font-medium", specialStatus.color)}>{specialStatus.label}</span>
        </motion.div>
      )}

      {/* Progress bar */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {TICKET_STAGES.map((stage, i) => {
            const isCompleted = i < currentIndex;
            const isCurrent = i === currentIndex;
            const StageIcon = stage.icon;

            return (
              <div key={stage.key} className="flex flex-col items-center relative z-10">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "flex items-center justify-center h-9 w-9 rounded-full border-2 transition-all",
                    isCompleted && "bg-emerald-500 border-emerald-500 text-white",
                    isCurrent && "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20",
                    !isCompleted && !isCurrent && "bg-muted border-muted-foreground/20 text-muted-foreground/40"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <StageIcon className="h-4 w-4" />
                  )}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  className="mt-2 text-center"
                >
                  <p className={cn(
                    "text-[11px] font-medium",
                    isCurrent ? "text-primary" : isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/50"
                  )}>
                    {stage.label}
                  </p>
                  {isCurrent && (
                    <p className="text-[9px] text-muted-foreground mt-0.5">{stage.description}</p>
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Connecting line */}
        <div className="absolute top-[18px] right-[18px] left-[18px] h-0.5 bg-muted-foreground/10 -z-0" />
        <motion.div
          className="absolute top-[18px] right-[18px] h-0.5 bg-emerald-500 -z-0"
          initial={{ width: 0 }}
          animate={{ width: `${(currentIndex / (TICKET_STAGES.length - 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
