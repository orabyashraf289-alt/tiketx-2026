import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSLAPolicies, updateSLAPolicy } from '@/lib/api';
import { PageLayout, PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Timer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n';
import { useLocalizedLabels } from '@/hooks/useLocalizedLabels';
import { LoadingSpinner } from '@/components/common';

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
  const { t, isRTL } = useLanguage();
  const { priorityLabels: localizedPriority } = useLocalizedLabels();

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
      toast({ title: t.admin.slaUpdated });
    },
  });

  return (
    <PageLayout>
      <PageHeader title={t.admin.slaTitle} icon={<Timer className="h-5 w-5" />} />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {isLoading ? (
          <LoadingSpinner size="lg" fullPage />
        ) : (
          <motion.div variants={pageVariants} initial="hidden" animate="visible" className="max-w-2xl mx-auto space-y-4">
            <motion.p variants={fadeUp} className="text-sm text-muted-foreground mb-4">{t.admin.slaDesc}</motion.p>
            {policies.map(policy => (
              <motion.div key={policy.id} variants={fadeUp} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Card className="rounded-2xl border-border/50 shadow-card hover:shadow-card-hover transition-shadow duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Timer className="h-4 w-4 text-primary" />
                      </div>
                      {localizedPriority[policy.priority]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">{t.admin.firstResponseMin}</Label>
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
                        <Label className="text-xs">{t.admin.resolutionMin}</Label>
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
                      {updateMut.isPending && <Loader2 className={`h-3 w-3 animate-spin ${isRTL ? 'ml-1' : 'mr-1'}`} />}
                      {t.common.save}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </PageLayout>
  );
}
