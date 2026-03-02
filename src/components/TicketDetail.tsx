import { Ticket } from "@/types/ticket";
import { StatusBadge, PriorityBadge } from "@/components/TicketBadges";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { User, Clock, Tag, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface TicketDetailProps {
  ticket: Ticket;
}

export function TicketDetail({ ticket }: TicketDetailProps) {
  const [reply, setReply] = useState("");

  return (
    <div className="animate-slide-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-muted-foreground">{ticket.id}</span>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <h2 className="text-xl font-bold">{ticket.title}</h2>
        <p className="text-sm text-muted-foreground mt-2">{ticket.description}</p>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">مقدم الطلب</p>
            <p className="font-medium">{ticket.requester.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">المعالج</p>
            <p className="font-medium">{ticket.agent?.name || "غير معيّن"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
            <p className="font-medium">{format(new Date(ticket.createdAt), "d MMM yyyy, HH:mm", { locale: ar })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">التصنيف</p>
            <p className="font-medium">{ticket.category}</p>
          </div>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Messages */}
      <div className="mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          المحادثة ({ticket.messages.length})
        </h3>
        {ticket.messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد رسائل بعد</p>
        ) : (
          <div className="space-y-4">
            {ticket.messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg p-4 ${
                  msg.isAgent
                    ? "bg-primary/5 border border-primary/10 mr-6"
                    : "bg-muted ml-6"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{msg.sender}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(msg.timestamp), "d MMM, HH:mm", { locale: ar })}
                  </span>
                </div>
                <p className="text-sm">{msg.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply */}
      <div className="space-y-3">
        <Textarea
          placeholder="اكتب ردك هنا..."
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className="min-h-[100px] resize-none"
        />
        <div className="flex justify-end">
          <Button className="gradient-accent text-accent-foreground gap-2">
            <Send className="h-4 w-4" />
            إرسال الرد
          </Button>
        </div>
      </div>
    </div>
  );
}
