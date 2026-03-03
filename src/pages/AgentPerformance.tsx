import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { Award, Star, Clock, CheckCircle, TrendingUp, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AgentStats {
  agent_id: string;
  name: string;
  resolved: number;
  avgResolutionHours: number;
  avgRating: number;
  ratingCount: number;
  assigned: number;
}

async function fetchAgentPerformance(): Promise<AgentStats[]> {
  // Get agents
  const { data: roles } = await supabase.from('user_roles').select('user_id, role').in('role', ['agent', 'admin']);
  if (!roles?.length) return [];

  const agentIds = roles.map(r => r.user_id);
  
  const [profilesRes, ticketsRes, ratingsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name').in('id', agentIds),
    supabase.from('tickets').select('assigned_agent_id, status, created_at, resolved_at').in('assigned_agent_id', agentIds),
    supabase.from('ticket_ratings').select('ticket_id, rating').then(async (res) => {
      if (!res.data?.length) return [];
      const ticketIds = res.data.map(r => r.ticket_id);
      const { data: tickets } = await supabase.from('tickets').select('id, assigned_agent_id').in('id', ticketIds);
      return res.data.map(r => ({
        ...r,
        agent_id: tickets?.find(t => t.id === r.ticket_id)?.assigned_agent_id,
      }));
    }),
  ]);

  const profiles = profilesRes.data || [];
  const tickets = ticketsRes.data || [];
  const ratings = ratingsRes || [];

  return agentIds.map(id => {
    const name = profiles.find(p => p.id === id)?.full_name || 'غير معروف';
    const agentTickets = tickets.filter(t => t.assigned_agent_id === id);
    const resolved = agentTickets.filter(t => t.status === 'resolved' || t.status === 'closed');
    
    let totalMs = 0;
    resolved.forEach(t => {
      if (t.resolved_at) {
        totalMs += new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime();
      }
    });

    const agentRatings = ratings.filter((r: any) => r.agent_id === id);
    const avgRating = agentRatings.length > 0
      ? agentRatings.reduce((s: number, r: any) => s + r.rating, 0) / agentRatings.length
      : 0;

    return {
      agent_id: id,
      name,
      resolved: resolved.length,
      avgResolutionHours: resolved.length > 0 ? Math.round(totalMs / resolved.length / (1000 * 60 * 60) * 10) / 10 : 0,
      avgRating: Math.round(avgRating * 10) / 10,
      ratingCount: agentRatings.length,
      assigned: agentTickets.length,
    };
  }).sort((a, b) => b.resolved - a.resolved);
}

const medals = ['🥇', '🥈', '🥉'];

export default function AgentPerformance() {
  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agent-performance'],
    queryFn: fetchAgentPerformance,
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 gap-3 shrink-0 sticky top-0 z-30"
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <Award className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">أداء الوكلاء</h1>
            </div>
            <NotificationsPopover />
          </motion.header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Summary Cards */}
              {!isLoading && agents.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <SummaryCard icon={CheckCircle} label="إجمالي المحلولة" value={agents.reduce((s, a) => s + a.resolved, 0)} color="text-success" />
                  <SummaryCard icon={Clock} label="أسرع حل" value={`${Math.min(...agents.filter(a => a.avgResolutionHours > 0).map(a => a.avgResolutionHours)) || 0}h`} color="text-info" />
                  <SummaryCard icon={Star} label="أعلى تقييم" value={Math.max(...agents.map(a => a.avgRating)) || 0} color="text-warning" />
                  <SummaryCard icon={TrendingUp} label="عدد الوكلاء" value={agents.length} color="text-primary" />
                </div>
              )}

              {/* Leaderboard */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    ترتيب الوكلاء
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                  ) : agents.length === 0 ? (
                    <p className="text-center py-16 text-muted-foreground">لا يوجد بيانات</p>
                  ) : (
                    <div className="space-y-3">
                      {agents.map((agent, i) => (
                        <motion.div
                          key={agent.agent_id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-card-hover ${
                            i < 3 ? 'bg-primary/5 border-primary/20' : 'border-border/50'
                          }`}
                        >
                          <span className="text-2xl w-8 text-center shrink-0">
                            {i < 3 ? medals[i] : <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground truncate">{agent.name}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-success" />{agent.resolved} محلولة</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-info" />{agent.avgResolutionHours}h حل</span>
                              {agent.ratingCount > 0 && (
                                <span className="flex items-center gap-1"><Star className="h-3 w-3 text-warning fill-warning" />{agent.avgRating} ({agent.ratingCount})</span>
                              )}
                            </div>
                          </div>
                          <div className="text-left shrink-0">
                            <p className="text-2xl font-bold text-foreground">{agent.assigned}</p>
                            <p className="text-[10px] text-muted-foreground">تذكرة</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <Card className="text-center">
        <CardContent className="pt-5">
          <Icon className={`h-5 w-5 mx-auto mb-1.5 ${color}`} />
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
