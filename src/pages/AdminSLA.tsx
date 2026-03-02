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
        map[p.id] = { response: p.response_time_hours, resolution: p.resolution_time_hours };
      });
      setEdits(map);
    }
  }, [policies]);

  const updateMut = useMutation({
    mutationFn: ({ id, response, resolution }: { id: string; response: number; resolution: number }) =>
      updateSLAPolicy(id, { response_time_hours: response, resolution_time_hours: resolution }),
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
          <header className="h-14 flex items-center border-b bg-card px-4 gap-3 shrink-0">
            <SidebarTrigger />
            <h1 className="text-lg font-bold">إعدادات SLA</h1>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-4">
                <p className="text-sm text-muted-foreground mb-4">حدد زمن الاستجابة والحل المتوقع لكل مستوى أولوية (بالساعات)</p>
                {policies.map(policy => (
                  <Card key={policy.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        {priorityLabels[policy.priority]}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">زمن الاستجابة (ساعات)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={edits[policy.id]?.response ?? policy.response_time_hours}
                            onChange={e => setEdits(prev => ({
                              ...prev,
                              [policy.id]: { ...prev[policy.id], response: parseInt(e.target.value) || 1 }
                            }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">زمن الحل (ساعات)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={edits[policy.id]?.resolution ?? policy.resolution_time_hours}
                            onChange={e => setEdits(prev => ({
                              ...prev,
                              [policy.id]: { ...prev[policy.id], resolution: parseInt(e.target.value) || 1 }
                            }))}
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="mt-3 gradient-accent text-accent-foreground"
                        disabled={updateMut.isPending}
                        onClick={() => updateMut.mutate({
                          id: policy.id,
                          response: edits[policy.id]?.response ?? policy.response_time_hours,
                          resolution: edits[policy.id]?.resolution ?? policy.resolution_time_hours,
                        })}
                      >
                        {updateMut.isPending && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                        حفظ
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
