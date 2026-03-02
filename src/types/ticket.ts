export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface TicketUser {
  name: string;
  email: string;
  avatar: string;
}

export interface TicketMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isAgent: boolean;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  requester: TicketUser;
  agent: TicketUser | null;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export const statusLabels: Record<TicketStatus, string> = {
  open: "مفتوحة",
  in_progress: "قيد المعالجة",
  resolved: "تم الحل",
  closed: "مغلقة",
};

export const priorityLabels: Record<TicketPriority, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  urgent: "عاجلة",
};
