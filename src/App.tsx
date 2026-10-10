import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useTenantBranding } from '@/hooks/useTenantBranding';
import { useRealtimeNotificationSound } from '@/hooks/useRealtimeNotificationSound';
import { ThemeProvider } from '@/hooks/useTheme';
import { SystemSettingsProvider } from '@/hooks/useSystemSettings';
import { LanguageProvider } from '@/i18n';
import { PageLoader } from '@/components/PageLoader';
import { CustomerChatbot } from '@/components/CustomerChatbot';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Lazy-loaded pages
const Index = lazy(() => import('./pages/Index'));
const AuthPage = lazy(() => import('./pages/Auth'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const NewTicket = lazy(() => import('./pages/NewTicket'));
const TicketsInbox = lazy(() => import('./pages/TicketsInbox'));
const TicketDetail = lazy(() => import('./pages/TicketDetail'));
const AdminDepartments = lazy(() => import('./pages/AdminDepartments'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminSLA = lazy(() => import('./pages/AdminSLA'));
const AdminReports = lazy(() => import('./pages/AdminReports'));
const AdminServiceCatalog = lazy(() => import('./pages/AdminServiceCatalog'));
const AdminServiceFields = lazy(() => import('./pages/AdminServiceFields'));
const AdminApprovalStages = lazy(() => import('./pages/AdminApprovalStages'));
const AdminApprovalReports = lazy(() => import('./pages/AdminApprovalReports'));
const AdminApprovalKanban = lazy(() => import('./pages/AdminApprovalKanban'));
const AdminApprovalHealth = lazy(() => import('./pages/AdminApprovalHealth'));
const AdminApprovalTemplates = lazy(() => import('./pages/AdminApprovalTemplates'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AgentPerformance = lazy(() => import('./pages/AgentPerformance'));
const AdminExternalAPI = lazy(() => import('./pages/AdminExternalAPI'));
const AdminWebhooks = lazy(() => import('./pages/AdminWebhooks'));
const AdminAutomation = lazy(() => import('./pages/AdminAutomation'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const CustomerPortal = lazy(() => import('./pages/CustomerPortal'));
const DeveloperDashboard = lazy(() => import('./pages/DeveloperDashboard'));
const CSATAnalytics = lazy(() => import('./pages/CSATAnalytics'));
const SLACompliance = lazy(() => import('./pages/SLACompliance'));
const ExecutiveDashboard = lazy(() => import('./pages/ExecutiveDashboard'));
const AdminSlackIntegration = lazy(() => import('./pages/AdminSlackIntegration'));
const AdminAuditLog = lazy(() => import('./pages/AdminAuditLog'));
const AdminSecurityDashboard = lazy(() => import('./pages/AdminSecurityDashboard'));
const AdminSecuritySettings = lazy(() => import('./pages/AdminSecuritySettings'));
const AdminEmailManagement = lazy(() => import('./pages/AdminEmailManagement'));
const AdminChannels = lazy(() => import('./pages/AdminChannels'));
const AdminReportBuilder = lazy(() => import('./pages/AdminReportBuilder'));
const AdminTenants = lazy(() => import('./pages/AdminTenants'));
const AdminWhatsApp = lazy(() => import('./pages/AdminWhatsApp'));
const AdminClasseraIntegrations = lazy(() => import('./pages/AdminClasseraIntegrations'));
const AdminBilling = lazy(() => import('./pages/AdminBilling'));
const OnboardingWizard = lazy(() => import('./pages/OnboardingWizard'));
const SystemHealthMonitoring = lazy(() => import('./pages/SystemHealthMonitoring'));
const SystemGuide = lazy(() => import('./pages/SystemGuide'));
const AdminRoadmap = lazy(() => import('./pages/AdminRoadmap'));
const AdminIntegrations = lazy(() => import('./pages/AdminIntegrations'));

const NotificationsInbox = lazy(() => import('./pages/NotificationsInbox'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Forbidden = lazy(() => import('./pages/Forbidden'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403 auth errors
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

function ProtectedRoute({ children, redirectRequester }: { children: React.ReactNode; redirectRequester?: boolean }) {
  const { user, loading, role } = useAuth();
  useRealtimeNotificationSound();
  useTenantBranding(); // Apply tenant white-label branding
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  if (redirectRequester && role === 'requester') return <Navigate to="/portal" replace />;
  if (redirectRequester && role === 'developer') return <Navigate to="/developer" replace />;
  return <>{children}<CustomerChatbot /></>;
}

function RequesterRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  useRealtimeNotificationSound();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

/** Restricts a route to specific roles; anything else gets the 403 page. */
function RoleRoute({ children, allow }: { children: React.ReactNode; allow: Array<'admin' | 'agent' | 'requester' | 'developer'> }) {
  const { user, loading, role } = useAuth();
  useRealtimeNotificationSound();
  useTenantBranding();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!role) return <PageLoader />;
  if (!allow.includes(role)) return <Forbidden />;
  return <>{children}<CustomerChatbot /></>;
}

const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <RoleRoute allow={['admin']}>{children}</RoleRoute>
);

const StaffRoute = ({ children }: { children: React.ReactNode }) => (
  <RoleRoute allow={['admin', 'agent', 'developer']}>{children}</RoleRoute>
);

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <SystemSettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/" element={<ProtectedRoute redirectRequester><Index /></ProtectedRoute>} />
                    <Route path="/portal" element={<RequesterRoute><CustomerPortal /></RequesterRoute>} />
                    <Route path="/portal/tickets" element={<RequesterRoute><CustomerPortal /></RequesterRoute>} />
                    <Route path="/portal/new" element={<RequesterRoute><CustomerPortal /></RequesterRoute>} />
                    <Route path="/portal/kb" element={<RequesterRoute><CustomerPortal /></RequesterRoute>} />
                    <Route path="/tickets" element={<ProtectedRoute redirectRequester><TicketsInbox /></ProtectedRoute>} />
                    <Route path="/tickets/new" element={<ProtectedRoute redirectRequester><NewTicket /></ProtectedRoute>} />
                    <Route path="/developer" element={<RoleRoute allow={['admin', 'developer']}><DeveloperDashboard /></RoleRoute>} />
                    <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
                    <Route path="/admin/departments" element={<AdminRoute><AdminDepartments /></AdminRoute>} />
                    <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                    <Route path="/admin/sla" element={<AdminRoute><AdminSLA /></AdminRoute>} />
                    <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
                    <Route path="/admin/services" element={<AdminRoute><AdminServiceCatalog /></AdminRoute>} />
                    <Route path="/admin/service-fields" element={<AdminRoute><AdminServiceFields /></AdminRoute>} />
                    <Route path="/admin/approval-stages" element={<AdminRoute><AdminApprovalStages /></AdminRoute>} />
                    <Route path="/admin/approval-reports" element={<AdminRoute><AdminApprovalReports /></AdminRoute>} />
                    <Route path="/admin/approval-kanban" element={<StaffRoute><AdminApprovalKanban /></StaffRoute>} />
                    <Route path="/admin/approval-health" element={<AdminRoute><AdminApprovalHealth /></AdminRoute>} />
                    <Route path="/admin/approval-templates" element={<AdminRoute><AdminApprovalTemplates /></AdminRoute>} />
                    <Route path="/knowledge-base" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/admin/agent-performance" element={<AdminRoute><AgentPerformance /></AdminRoute>} />
                    <Route path="/admin/external-api" element={<AdminRoute><AdminExternalAPI /></AdminRoute>} />
                    <Route path="/admin/webhooks" element={<AdminRoute><AdminWebhooks /></AdminRoute>} />
                    <Route path="/admin/automation" element={<AdminRoute><AdminAutomation /></AdminRoute>} />
                    <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
                    <Route path="/admin/csat-analytics" element={<AdminRoute><CSATAnalytics /></AdminRoute>} />
                    <Route path="/admin/sla-compliance" element={<AdminRoute><SLACompliance /></AdminRoute>} />
                    <Route path="/admin/executive" element={<AdminRoute><ExecutiveDashboard /></AdminRoute>} />
                    <Route path="/admin/slack" element={<AdminRoute><AdminSlackIntegration /></AdminRoute>} />
                    <Route path="/admin/audit-log" element={<AdminRoute><AdminAuditLog /></AdminRoute>} />
                    <Route path="/admin/security" element={<AdminRoute><AdminSecurityDashboard /></AdminRoute>} />
                    <Route path="/admin/security-settings" element={<AdminRoute><AdminSecuritySettings /></AdminRoute>} />
                    <Route path="/admin/email" element={<AdminRoute><AdminEmailManagement /></AdminRoute>} />
                    <Route path="/admin/channels" element={<AdminRoute><AdminChannels /></AdminRoute>} />
                    <Route path="/admin/report-builder" element={<AdminRoute><AdminReportBuilder /></AdminRoute>} />
                    <Route path="/admin/tenants" element={<AdminRoute><AdminTenants /></AdminRoute>} />
                    <Route path="/admin/whatsapp" element={<AdminRoute><AdminWhatsApp /></AdminRoute>} />
                    <Route path="/admin/classera" element={<AdminRoute><AdminClasseraIntegrations /></AdminRoute>} />
                    <Route path="/admin/billing" element={<AdminRoute><AdminBilling /></AdminRoute>} />
                    <Route path="/admin/onboarding" element={<AdminRoute><OnboardingWizard /></AdminRoute>} />
                    <Route path="/admin/system-health" element={<AdminRoute><SystemHealthMonitoring /></AdminRoute>} />
                    <Route path="/system-guide" element={<ProtectedRoute><SystemGuide /></ProtectedRoute>} />
                    <Route path="/admin/roadmap" element={<AdminRoute><AdminRoadmap /></AdminRoute>} />
                    <Route path="/admin/integrations" element={<AdminRoute><AdminIntegrations /></AdminRoute>} />
                    
                    <Route path="/notifications" element={<ProtectedRoute><NotificationsInbox /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                </ErrorBoundary>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </SystemSettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
