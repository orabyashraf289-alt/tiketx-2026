import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { StatsCard } from "@/components/StatsCard";
import { TicketList } from "@/components/TicketList";
import { TicketDetail } from "@/components/TicketDetail";
import { mockTickets, statsData } from "@/data/mockData";
import { Ticket, TicketStatus } from "@/types/ticket";
import { Inbox, Clock, CheckCircle2, AlertTriangle, Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const statusFilters: { label: string; value: TicketStatus | "all" }[] = [
  { label: "الكل", value: "all" },
  { label: "مفتوحة", value: "open" },
  { label: "قيد المعالجة", value: "in_progress" },
  { label: "تم الحل", value: "resolved" },
  { label: "مغلقة", value: "closed" },
];

const Dashboard = () => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTickets = mockTickets.filter((t) => {
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesSearch = t.title.includes(searchQuery) || t.id.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 gap-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-bold hidden sm:block">لوحة التحكم</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-0.5 -left-0.5 h-4 w-4 rounded-full gradient-accent text-[10px] font-bold text-accent-foreground flex items-center justify-center">
                  3
                </span>
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatsCard title="إجمالي التذاكر" value={statsData.total} icon={Inbox} variant="primary" trend="↑ 12% عن الشهر الماضي" />
              <StatsCard title="مفتوحة" value={statsData.open} icon={AlertTriangle} variant="warning" />
              <StatsCard title="قيد المعالجة" value={statsData.inProgress} icon={Clock} variant="default" />
              <StatsCard title="تم الحل" value={statsData.resolved} icon={CheckCircle2} variant="success" />
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Ticket List */}
              <div className="lg:col-span-2">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث في التذاكر..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-9"
                      />
                    </div>
                  </div>
                  <div className="flex gap-1 mb-4 flex-wrap">
                    {statusFilters.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setStatusFilter(f.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          statusFilter === f.value
                            ? "gradient-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <TicketList tickets={filteredTickets} onSelect={setSelectedTicket} selectedId={selectedTicket?.id} />
                </div>
              </div>

              {/* Detail */}
              <div className="lg:col-span-3">
                <div className="rounded-lg border bg-card p-6 min-h-[400px]">
                  {selectedTicket ? (
                    <TicketDetail ticket={selectedTicket} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                      <Inbox className="h-16 w-16 mb-4 opacity-30" />
                      <p className="text-lg font-medium">اختر تذكرة لعرض تفاصيلها</p>
                      <p className="text-sm">اضغط على أي تذكرة من القائمة</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
