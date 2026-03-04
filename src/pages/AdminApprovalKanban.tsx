import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ApprovalKanban } from '@/components/ApprovalKanban';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

export default function AdminApprovalKanban() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="h-14 flex items-center border-b bg-card/80 backdrop-blur-md px-4 shrink-0 sticky top-0 z-30"
          >
            <SidebarTrigger />
            <h1 className="text-lg font-bold text-foreground mr-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accent" />
              لوحة الاعتمادات
            </h1>
          </motion.header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <ApprovalKanban />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
