import {
  LayoutDashboard, Inbox, Plus, LogOut, Building2, Users, Timer, BarChart3, BookOpen,
  FormInput, ShieldCheck, Award, Globe, Settings, Mail, Columns, Star, ShieldAlert,
  Webhook, Zap, MessageSquare, FileSearch, ShieldCheck as ShieldCheckIcon, Send, Bell,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useLanguage } from '@/i18n';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import logoImg from '@/assets/logo-icon.png';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { profile, role, signOut } = useAuth();
  const sysSettings = useSystemSettings();
  const { t, lang } = useLanguage();

  const logoSrc = sysSettings.logo_url || logoImg;
  const sysName = sysSettings.system_name || 'TicketFlow';
  const sysSub = sysSettings.system_subtitle || 'HELPDESK';

  const roleLabels: Record<string, string> = {
    admin: t.roles.admin,
    agent: t.roles.agent,
    requester: t.roles.requester,
    developer: t.roles.developer,
  };

  const mainItems = [
    { title: t.sidebar.dashboard, url: '/', icon: LayoutDashboard },
    { title: t.sidebar.tickets, url: '/tickets', icon: Inbox },
    { title: t.sidebar.newTicket, url: '/tickets/new', icon: Plus },
    { title: t.sidebar.knowledgeBase, url: '/knowledge-base', icon: BookOpen },
  ];

  const requesterItems = [
    { title: t.sidebar.followUpBoard, url: '/portal', icon: LayoutDashboard },
    { title: t.sidebar.myTickets, url: '/portal/tickets', icon: Inbox },
    { title: t.sidebar.newTicket, url: '/portal/new', icon: Plus },
    { title: t.sidebar.knowledgeBase, url: '/knowledge-base', icon: BookOpen },
  ];

  const developerItems = [
    { title: t.sidebar.developerBoard, url: '/developer', icon: LayoutDashboard },
    { title: t.sidebar.tickets, url: '/tickets', icon: Inbox },
    { title: t.sidebar.newTicket, url: '/tickets/new', icon: Plus },
    { title: t.sidebar.approvalBoard, url: '/admin/approval-kanban', icon: Columns },
    { title: t.sidebar.knowledgeBase, url: '/knowledge-base', icon: BookOpen },
  ];

  const adminItems = [
    { title: t.sidebar.executiveDashboard, url: '/admin/executive', icon: BarChart3 },
    { title: t.sidebar.serviceCatalog, url: '/admin/services', icon: BookOpen },
    { title: t.sidebar.serviceFields, url: '/admin/service-fields', icon: FormInput },
    { title: t.sidebar.approvalStages, url: '/admin/approval-stages', icon: ShieldCheck },
    { title: t.sidebar.approvalReports, url: '/admin/approval-reports', icon: BarChart3 },
    { title: t.sidebar.approvalBoard, url: '/admin/approval-kanban', icon: Columns },
    { title: t.sidebar.departments, url: '/admin/departments', icon: Building2 },
    { title: t.sidebar.users, url: '/admin/users', icon: Users },
    { title: t.sidebar.agentPerformance, url: '/admin/agent-performance', icon: Award },
    { title: t.sidebar.slaSettings, url: '/admin/sla', icon: Timer },
    { title: t.sidebar.reports, url: '/admin/reports', icon: BarChart3 },
    { title: t.sidebar.csatAnalytics, url: '/admin/csat-analytics', icon: Star },
    { title: t.sidebar.slaCompliance, url: '/admin/sla-compliance', icon: ShieldAlert },
    { title: t.sidebar.externalApi, url: '/admin/external-api', icon: Globe },
    { title: t.sidebar.webhooks, url: '/admin/webhooks', icon: Webhook },
    { title: t.sidebar.automation, url: '/admin/automation', icon: Zap },
    { title: t.sidebar.slackIntegration, url: '/admin/slack', icon: MessageSquare },
    { title: t.sidebar.auditLog, url: '/admin/audit-log', icon: FileSearch },
    { title: t.sidebar.securityGovernance, url: '/admin/security', icon: ShieldCheckIcon },
    { title: t.sidebar.securityNotifications, url: '/admin/security-settings', icon: Send },
    { title: t.sidebar.emailManagement, url: '/admin/email', icon: Mail },
    { title: t.sidebar.systemSettings, url: '/admin/settings', icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon" side={lang === 'ar' ? 'right' : 'left'}>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-card/10 backdrop-blur-sm border border-sidebar-border/50 shadow-lg shrink-0 overflow-hidden p-1">
            <img src={logoSrc} alt={sysName} className="h-full w-full object-contain drop-shadow-md" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-base font-extrabold text-sidebar-accent-foreground tracking-tight">{sysName}</h2>
              <p className="text-[10px] text-sidebar-foreground/50 font-medium tracking-widest uppercase">{sysSub}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider font-semibold px-3">
            {t.sidebar.menu}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(role === 'requester' ? requesterItems : role === 'developer' ? developerItems : mainItems).map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-medium hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {role === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider font-semibold px-3">
              {t.sidebar.administration}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
                        activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-medium hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {!collapsed && profile && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 cursor-pointer rounded-lg p-2 hover:bg-sidebar-accent transition-colors" onClick={() => window.location.href = '/profile'}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground shrink-0">
                {profile.full_name?.charAt(0) || 'م'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-sidebar-accent-foreground truncate">{profile.full_name}</p>
                <p className="text-[10px] text-sidebar-foreground/50">{role ? roleLabels[role] : ''}</p>
              </div>
              <div className="flex items-center gap-1">
                <LanguageSwitcher />
                <ThemeToggle size="icon" />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => signOut()}
            >
              <LogOut className="h-3 w-3 ltr:mr-1 rtl:ml-1" />
              {t.common.signOut}
            </Button>
          </div>
        )}
        {collapsed && (
          <div className="flex flex-col items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle size="icon" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-sidebar-foreground/50 hover:text-sidebar-foreground" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={lang === 'ar' ? 'left' : 'right'}>{t.common.signOut}</TooltipContent>
            </Tooltip>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
