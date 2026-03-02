import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSLAPolicies, updateSLAPolicy, priorityLabels } from '@/lib/api';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Timer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function AdminSLA() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['sla-policies'],
    queryFn: fetchSLAPolicies,
  });

  const [edits, setEdits] = useState<Record<string, { response: number; resolution: number }>>({});

  useEffect(() => {
    if (policies.length > 0) {
      const map: typeof edits = {};
      policies.forEach(p => {
        map[p.id] = { response: p.first_response_minutes, resolution: p.resolution_minutes };
      });
      setEdits(map);
    }
  }, [policies]);

  const updateMut = useMutation({
    mutationFn: ({ id, response, resolution }: { id: string; response: number; resolution: number }) =>
      updateSLAPolicy(id, { first_response_minutes: response, resolution_minutes: resolution }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      toast({ title: 'تم تحديث إعدادات SLA' });
    },
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="h-14 flex items-center border-b bg-card/80 backdrop-blur-md px-4 gap-3 shrink-0 sticky top-0 z-30"
          >
            <SidebarTrigger />
            <h1 className="text-lg font-bold text-foreground">إعدادات SLA</h1>
          </motion.header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <motion.div variants={pageVariants} initial="hidden" animate="visible" className="max-w-2xl mx-auto space-y-4">
                <motion.p variants={fadeUp} className="text-sm text-muted-foreground mb-4">حدد زمن الاستجابة والحل المتوقع لكل مستوى أولوية (بالدقائق)</motion.p>
                {policies.map(policy => (
                  <motion.div key={policy.id} variants={fadeUp} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                    <Card className="rounded-2xl border-border/50 shadow-card hover:shadow-card-hover transition-shadow duration-300">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Timer className="h-4 w-4 text-primary" />
                          </div>
                          {priorityLabels[policy.priority]}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs">زمن الاستجابة (دقائق)</Label>
                            <Input
                              type="number"
                              min={1}
                              className="rounded-xl"
                              value={edits[policy.id]?.response ?? policy.first_response_minutes}
                              onChange={e => setEdits(prev => ({
                                ...prev,
                                [policy.id]: { ...prev[policy.id], response: parseInt(e.target.value) || 1 }
                              }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">زمن الحل (دقائق)</Label>
                            <Input
                              type="number"
                              min={1}
                              className="rounded-xl"
                              value={edits[policy.id]?.resolution ?? policy.resolution_minutes}
                              onChange={e => setEdits(prev => ({
                                ...prev,
                                [policy.id]: { ...prev[policy.id], resolution: parseInt(e.target.value) || 1 }
                              }))}
                            />
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="mt-3 gradient-accent text-accent-foreground rounded-xl shadow-lg shadow-primary/20"
                          disabled={updateMut.isPending}
                          onClick={() => updateMut.mutate({
                            id: policy.id,
                            response: edits[policy.id]?.response ?? policy.first_response_minutes,
                            resolution: edits[policy.id]?.resolution ?? policy.resolution_minutes,
                          })}
                        >
                          {updateMut.isPending && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                          حفظ
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
