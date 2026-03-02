import { supabase } from '@/integrations/supabase/client';

export type TicketStatus = 'new' | 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed' | 'reopened';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NoteType = 'public' | 'private';
export type AppRole = 'admin' | 'agent' | 'requester';

export interface Ticket {
  id: string;
  ticket_number: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  department_id: string | null;
  requester_id: string;
  assigned_agent_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  // Joined
  departments?: { name: string } | null;
  requester?: { full_name: string; email: string } | null;
  agent?: { full_name: string; email: string } | null;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  content: string;
  note_type: NoteType;
  created_at: string;
  author?: { full_name: string; email: string } | null;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
}

export interface AuditLog {
  id: string;
  ticket_id: string;
  user_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  user?: { full_name: string } | null;
}

export interface Notification {
  id: string;
  user_id: string;
  ticket_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const statusLabels: Record<TicketStatus, string> = {
  new: 'جديدة',
  open: 'مفتوحة',
  in_progress: 'قيد المعالجة',
  waiting_on_customer: 'بانتظار العميل',
  resolved: 'تم الحل',
  closed: 'مغلقة',
  reopened: 'أُعيد فتحها',
};

export const priorityLabels: Record<TicketPriority, string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
};

export const roleLabels: Record<AppRole, string> = {
  admin: 'مشرف',
  agent: 'دعم فني',
  requester: 'مستخدم',
};

// API functions
const TICKET_SELECT = '*, departments(name), requester:profiles!tickets_requester_id_fkey(full_name, email), agent:profiles!tickets_assigned_agent_id_fkey(full_name, email)';

export async function fetchTickets() {
  const { data, error } = await supabase
    .from('tickets')
    .select(TICKET_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown) as Ticket[];
}

export async function fetchTicketById(id: string) {
  const { data, error } = await supabase
    .from('tickets')
    .select(TICKET_SELECT)
    .eq('id', id)
    .single();
  if (error) throw error;
  return (data as unknown) as Ticket;
}

export async function createTicket(ticket: { title: string; description: string; priority: TicketPriority; department_id: string; requester_id: string }) {
  const { data, error } = await supabase.from('tickets').insert(ticket).select().single();
  if (error) throw error;
  return data;
}

export async function updateTicket(id: string, updates: Partial<Ticket>) {
  const { data, error } = await supabase.from('tickets').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function fetchComments(ticketId: string) {
  const { data, error } = await supabase
    .from('ticket_comments')
    .select('*, author:profiles!ticket_comments_author_id_fkey(full_name, email)')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as unknown) as TicketComment[];
}

export async function addComment(comment: { ticket_id: string; author_id: string; content: string; note_type: NoteType }) {
  const { data, error } = await supabase.from('ticket_comments').insert(comment).select().single();
  if (error) throw error;
  return data;
}

export async function fetchDepartments() {
  const { data, error } = await supabase.from('departments').select('*').order('name');
  if (error) throw error;
  return data as Department[];
}

export async function fetchAuditLogs(ticketId: string) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, user:profiles!audit_logs_user_id_fkey(full_name)')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown) as AuditLog[];
}

export async function addAuditLog(log: { ticket_id: string; user_id: string; action: string; old_value?: string; new_value?: string }) {
  const { error } = await supabase.from('audit_logs').insert(log);
  if (error) throw error;
}

export async function fetchNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data as Notification[];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function fetchAgents() {
  const { data, error } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .in('role', ['agent', 'admin']);
  if (error) throw error;
  
  // Fetch profiles for these agents
  const userIds = (data || []).map(d => d.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);
  
  return (data || []).map(d => ({
    ...d,
    profiles: profiles?.find(p => p.id === d.user_id) || null,
  }));
}

export async function fetchTicketStats() {
  const { data, error } = await supabase.from('tickets').select('status');
  if (error) throw error;
  const stats = { total: 0, new: 0, open: 0, in_progress: 0, waiting_on_customer: 0, resolved: 0, closed: 0, reopened: 0 };
  (data || []).forEach((t: any) => {
    stats.total++;
    stats[t.status as keyof typeof stats]++;
  });
  return stats;
}
