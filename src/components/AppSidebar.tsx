import {
  LayoutDashboard,
  Inbox,
  Plus,
  LogOut,
  Building2,
  Users,
  Timer,
  BarChart3,
  BookOpen,
  FormInput,
  ShieldCheck,
  Award,
  Globe,
  Settings,
  HelpCircle,
  MessageSquare,
  Mail,
  Columns,
  Star,
  ShieldAlert,
  Webhook,
  Zap,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { roleLabels } from '@/lib/api';
import logoImg from '@/assets/logo-icon.png';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const mainItems = [
  { title: 'لوحة التحكم', url: '/', icon: LayoutDashboard },
  { title: 'التذاكر', url: '/tickets', icon: Inbox },
  { title: 'تذكرة جديدة', url: '/tickets/new', icon: Plus },
  { title: 'قاعدة المعرفة', url: '/knowledge-base', icon: BookOpen },
];

const requesterItems = [
  { title: 'لوحة المتابعة', url: '/portal', icon: LayoutDashboard },
  { title: 'تذاكري', url: '/portal/tickets', icon: Inbox },
  { title: 'تذكرة جديدة', url: '/portal/new', icon: Plus },
  { title: 'قاعدة المعرفة', url: '/knowledge-base', icon: BookOpen },
];

const developerItems = [
  { title: 'لوحة المطور', url: '/developer', icon: LayoutDashboard },
  { title: 'التذاكر', url: '/tickets', icon: Inbox },
  { title: 'تذكرة جديدة', url: '/tickets/new', icon: Plus },
  { title: 'لوحة الاعتمادات', url: '/admin/approval-kanban', icon: Columns },
  { title: 'قاعدة المعرفة', url: '/knowledge-base', icon: BookOpen },
];

const adminItems = [
  { title: 'Dashboard تنفيذي', url: '/admin/executive', icon: BarChart3 },
  { title: 'كتالوج الخدمات', url: '/admin/services', icon: BookOpen },
  { title: 'حقول الخدمات', url: '/admin/service-fields', icon: FormInput },
  { title: 'مراحل الاعتماد', url: '/admin/approval-stages', icon: ShieldCheck },
  { title: 'تقرير الاعتمادات', url: '/admin/approval-reports', icon: BarChart3 },
  { title: 'لوحة الاعتمادات', url: '/admin/approval-kanban', icon: Columns },
  { title: 'الأقسام', url: '/admin/departments', icon: Building2 },
  { title: 'المستخدمين', url: '/admin/users', icon: Users },
  { title: 'أداء الوكلاء', url: '/admin/agent-performance', icon: Award },
  { title: 'إعدادات SLA', url: '/admin/sla', icon: Timer },
  { title: 'التقارير', url: '/admin/reports', icon: BarChart3 },
  { title: 'تحليلات CSAT', url: '/admin/csat-analytics', icon: Star },
  { title: 'تقرير SLA', url: '/admin/sla-compliance', icon: ShieldAlert },
  { title: 'واجهة API', url: '/admin/external-api', icon: Globe },
  { title: 'Webhooks', url: '/admin/webhooks', icon: Webhook },
  { title: 'سير العمل التلقائي', url: '/admin/automation', icon: Zap },
  { title: 'إعدادات النظام', url: '/admin/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { profile, role, signOut } = useAuth();
  const sysSettings = useSystemSettings();

  const logoSrc = sysSettings.logo_url || logoImg;
  const sysName = sysSettings.system_name || 'TicketFlow';
  const sysSub = sysSettings.system_subtitle || 'HELPDESK';

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20 shrink-0 overflow-hidden">
            <img src={logoSrc} alt={sysName} className="h-8 w-8 object-contain" />
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
            القائمة
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(role === 'requester' ? requesterItems : role === 'developer' ? developerItems : mainItems).map((item) => (
                <SidebarMenuItem key={item.title}>
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
              الإدارة
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
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
              <ThemeToggle size="icon" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => signOut()}
            >
              <LogOut className="h-3 w-3 ml-1" />
              تسجيل خروج
            </Button>
          </div>
        )}
        {collapsed && (
          <div className="flex flex-col items-center gap-2">
            <ThemeToggle size="icon" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-sidebar-foreground/50 hover:text-sidebar-foreground" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">تسجيل خروج</TooltipContent>
            </Tooltip>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
