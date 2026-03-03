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
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
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
import { roleLabels, AppRole } from '@/lib/api';
import logoImg from '@/assets/logo.png';

const mainItems = [
  { title: 'لوحة التحكم', url: '/', icon: LayoutDashboard },
  { title: 'صندوق التذاكر', url: '/tickets', icon: Inbox },
  { title: 'تذكرة جديدة', url: '/tickets/new', icon: Plus },
  { title: 'قاعدة المعرفة', url: '/knowledge-base', icon: BookOpen },
];

const adminItems = [
  { title: 'كتالوج الخدمات', url: '/admin/services', icon: BookOpen },
  { title: 'حقول الخدمات', url: '/admin/service-fields', icon: FormInput },
  { title: 'مراحل الاعتماد', url: '/admin/approval-stages', icon: ShieldCheck },
  { title: 'الأقسام', url: '/admin/departments', icon: Building2 },
  { title: 'المستخدمين', url: '/admin/users', icon: Users },
  { title: 'إعدادات SLA', url: '/admin/sla', icon: Timer },
  { title: 'التقارير', url: '/admin/reports', icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="TicketFlow" className="h-9 w-9 rounded-lg shrink-0 object-contain" />
          {!collapsed && (
            <div>
              <h2 className="text-sm font-bold text-sidebar-accent-foreground">TicketFlow</h2>
              <p className="text-xs text-sidebar-foreground/60">نظام إدارة التذاكر</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <item.icon className="h-4 w-4 ml-2" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {role === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50">الإدارة</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                        <item.icon className="h-4 w-4 ml-2" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-3">
        {!collapsed && profile && (
          <div className="rounded-lg bg-sidebar-accent/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/profile'}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-xs font-bold text-primary-foreground shrink-0">
                  {profile.full_name?.charAt(0) || 'م'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-sidebar-accent-foreground truncate">{profile.full_name}</p>
                  <p className="text-[10px] text-sidebar-foreground/60">{role ? roleLabels[role] : ''}</p>
                </div>
              </div>
              <ThemeToggle size="icon" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground"
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
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
