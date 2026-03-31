import { memo, useMemo } from 'react';
import {
  LayoutDashboard, Inbox, Plus, LogOut, Building2, Users, Timer, BarChart3, BookOpen,
  FormInput, ShieldCheck, Award, Globe, Settings, Mail, Columns, Star, ShieldAlert,
  Webhook, Zap, MessageSquare, FileSearch, ShieldCheck as ShieldCheckIcon, Send, Bell,
  ChevronDown,
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

export const AppSidebar = memo(function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { profile, role, signOut } = useAuth();
  const sysSettings = useSystemSettings();
  const { t, lang } = useLanguage();

  const logoSrc = sysSettings.logo_url || logoImg;
  const sysName = sysSettings.system_name || 'Ticket-X';
  const sysSub = sysSettings.system_subtitle || 'SMART HELPDESK';

  const roleLabels: Record<string, string> = {
    admin: t.roles.admin,
    agent: t.roles.agent,
    requester: t.roles.requester,
    developer: t.roles.developer,
  };

  const mainItems = useMemo(() => [
    { title: t.sidebar.dashboard, url: '/', icon: LayoutDashboard },
    { title: t.sidebar.tickets, url: '/tickets', icon: Inbox },
    { title: t.sidebar.newTicket, url: '/tickets/new', icon: Plus },
    { title: t.sidebar.notificationsInbox, url: '/notifications', icon: Bell },
    { title: t.sidebar.knowledgeBase, url: '/knowledge-base', icon: BookOpen },
  ], [t]);

  const requesterItems = useMemo(() => [
    { title: t.sidebar.followUpBoard, url: '/portal', icon: LayoutDashboard },
    { title: t.sidebar.myTickets, url: '/portal/tickets', icon: Inbox },
    { title: t.sidebar.newTicket, url: '/portal/new', icon: Plus },
    { title: t.sidebar.notificationsInbox, url: '/notifications', icon: Bell },
    { title: t.sidebar.knowledgeBase, url: '/knowledge-base', icon: BookOpen },
  ], [t]);

  const developerItems = useMemo(() => [
    { title: t.sidebar.developerBoard, url: '/developer', icon: LayoutDashboard },
    { title: t.sidebar.tickets, url: '/tickets', icon: Inbox },
    { title: t.sidebar.newTicket, url: '/tickets/new', icon: Plus },
    { title: t.sidebar.notificationsInbox, url: '/notifications', icon: Bell },
    { title: t.sidebar.approvalBoard, url: '/admin/approval-kanban', icon: Columns },
    { title: t.sidebar.knowledgeBase, url: '/knowledge-base', icon: BookOpen },
  ], [t]);

  const adminItems = useMemo(() => [
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
  ], [t]);

  const MenuLink = ({ item }: { item: { url: string; title: string; icon: any } }) => (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          end={item.url === '/'}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 transition-all duration-200"
          activeClassName="bg-sidebar-primary/15 text-sidebar-primary font-semibold hover:bg-sidebar-primary/15 hover:text-sidebar-primary border-r-2 rtl:border-r-0 rtl:border-l-2 border-sidebar-primary"
        >
          <item.icon className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="text-[13px]">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" side={lang === 'ar' ? 'right' : 'left'}>
      {/* Header */}
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary/10 border border-sidebar-primary/20 shrink-0 overflow-hidden p-1.5 shadow-glow">
            <img src={logoSrc} alt={sysName} className="h-full w-full object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-sidebar-accent-foreground tracking-tight truncate">{sysName}</h2>
              <p className="text-[9px] text-sidebar-primary font-semibold tracking-[0.2em] uppercase">{sysSub}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2.5 py-2 custom-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/35 text-[9px] uppercase tracking-[0.15em] font-bold px-3 mb-1">
            {t.sidebar.menu}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {(role === 'requester' ? requesterItems : role === 'developer' ? developerItems : mainItems).map((item) => (
                <MenuLink key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {role === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/35 text-[9px] uppercase tracking-[0.15em] font-bold px-3 mb-1 mt-2">
              {t.sidebar.administration}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {adminItems.map((item) => (
                  <MenuLink key={item.url} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-3 border-t border-sidebar-border/50">
        {!collapsed && profile && (
          <div className="space-y-2">
            <div
              className="flex items-center gap-3 cursor-pointer rounded-xl p-2.5 hover:bg-sidebar-accent/60 transition-all duration-200"
              onClick={() => window.location.href = '/profile'}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-accent text-xs font-bold text-white shrink-0 shadow-sm">
                {profile.full_name?.charAt(0) || 'م'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-sidebar-accent-foreground truncate">{profile.full_name}</p>
                <p className="text-[10px] text-sidebar-primary/80 font-medium">{role ? roleLabels[role] : ''}</p>
              </div>
            </div>
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1">
                <LanguageSwitcher />
                <ThemeToggle size="icon" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg h-8"
                onClick={() => signOut()}
              >
                <LogOut className="h-3.5 w-3.5 ltr:mr-1 rtl:ml-1" />
                {t.common.signOut}
              </Button>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex flex-col items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle size="icon" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10" onClick={() => signOut()}>
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
});
