import { ReactNode, memo } from 'react';
import { motion } from 'framer-motion';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationsPopover } from '@/components/NotificationsPopover';

interface PageHeaderProps {
  title: string;
  icon?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  showNotifications?: boolean;
}

export const PageHeader = memo(function PageHeader({
  title,
  icon,
  badge,
  actions,
  showNotifications = true,
}: PageHeaderProps) {
  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="h-[56px] flex items-center justify-between border-b border-border/40 bg-card/90 backdrop-blur-xl px-4 gap-3 shrink-0 sticky top-0 z-30 no-print"
    >
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-primary">{icon}</span>
          </div>
        )}
        <h1 className="text-[15px] font-bold text-foreground">{title}</h1>
        {badge}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {showNotifications && <NotificationsPopover />}
      </div>
    </motion.header>
  );
});
