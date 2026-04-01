import { memo, useMemo } from 'react';
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
          className="group/link flex items-center gap-3 px-3 py-2.5 rounded-xl text-[hsl(30,20%,75%)] hover:text-[hsl(0,0%,100%)] hover:bg-[hsl(24,60%,50%,0.15)] transition-all duration-200"
          activeClassName="bg-gradient-to-l from-[hsl(24,95%,53%,0.2)] to-[hsl(340,75%,55%,0.1)] text-[hsl(0,0%,100%)] font-semibold border-r-[3px] rtl:border-r-0 rtl:border-l-[3px] border-[hsl(24,95%,55%)] shadow-[inset_0_0_20px_hsl(24,95%,53%,0.08)]"
        >
          <item.icon className="h-[18px] w-[18px] shrink-0 transition-colors duration-200" />
          {!collapsed && <span className="text-[13px]">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" side={lang === 'ar' ? 'right' : 'left'}>
      {/* Header */}
      <SidebarHeader className="relative overflow-hidden border-b border-[hsl(20,20%,18%)]">
        {/* Top gradient bar */}
        <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, hsl(24 95% 55%), hsl(340 75% 55%), hsl(24 95% 55%))' }} />
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl shrink-0 overflow-hidden p-1.5"
              style={{ background: 'linear-gradient(135deg, hsl(24 95% 50%), hsl(340 75% 50%))', boxShadow: '0 0 20px hsl(24 95% 53% / 0.4), 0 0 40px hsl(340 75% 55% / 0.2)' }}>
              <img src={logoSrc} alt={sysName} className="h-full w-full object-contain drop-shadow-lg" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h2 className="text-[16px] font-extrabold text-[hsl(0,0%,100%)] tracking-tight truncate">{sysName}</h2>
                <p className="text-[9px] font-bold tracking-[0.25em] uppercase"
                  style={{ background: 'linear-gradient(90deg, hsl(24 95% 60%), hsl(340 75% 60%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {sysSub}
                </p>
              </div>
            )}
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-3 py-3 custom-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[hsl(24,80%,60%)] text-[10px] uppercase tracking-[0.2em] font-bold px-3 mb-2">
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
            {/* Divider */}
            <div className="mx-3 my-3 h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(24 95% 55% / 0.3), hsl(340 75% 55% / 0.3), transparent)' }} />
            <SidebarGroupLabel className="text-[hsl(340,60%,65%)] text-[10px] uppercase tracking-[0.2em] font-bold px-3 mb-2">
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
      <SidebarFooter className="border-t border-[hsl(20,20%,18%)]">
        {!collapsed && profile && (
          <div className="p-3 space-y-3">
            {/* User card */}
            <div
              className="flex items-center gap-3 cursor-pointer rounded-xl p-3 hover:bg-[hsl(24,60%,50%,0.1)] transition-all duration-200"
              onClick={() => window.location.href = '/profile'}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-[hsl(0,0%,100%)] shrink-0"
                style={{ background: 'linear-gradient(135deg, hsl(24 95% 53%), hsl(340 75% 55%))', boxShadow: '0 4px 12px hsl(24 95% 53% / 0.3)' }}>
                {profile.full_name?.charAt(0) || 'م'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-[hsl(0,0%,100%)] truncate">{profile.full_name}</p>
                <p className="text-[10px] font-semibold" style={{ color: 'hsl(24 80% 60%)' }}>{role ? roleLabels[role] : ''}</p>
              </div>
            </div>
            {/* Actions bar */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1">
                <LanguageSwitcher />
                <ThemeToggle size="icon" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[hsl(30,20%,45%)] hover:text-destructive hover:bg-destructive/10 rounded-lg h-8"
                onClick={() => signOut()}
              >
                <LogOut className="h-3.5 w-3.5 ltr:mr-1 rtl:ml-1" />
                {t.common.signOut}
              </Button>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex flex-col items-center gap-2 p-2">
            <LanguageSwitcher />
            <ThemeToggle size="icon" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[hsl(30,20%,45%)] hover:text-destructive hover:bg-destructive/10" onClick={() => signOut()}>
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
