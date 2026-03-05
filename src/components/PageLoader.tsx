import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-muted animate-pulse" />
          <Loader2 className="h-12 w-12 animate-spin text-primary absolute inset-0" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">جاري التحميل...</p>
      </motion.div>
    </div>
  );
}
