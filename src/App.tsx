import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useRealtimeNotificationSound } from '@/hooks/useRealtimeNotificationSound';
import { ThemeProvider } from '@/hooks/useTheme';
import { SystemSettingsProvider } from '@/hooks/useSystemSettings';
import Index from './pages/Index';
import AuthPage from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import NewTicket from './pages/NewTicket';
import TicketsInbox from './pages/TicketsInbox';
import TicketDetail from './pages/TicketDetail';
import AdminDepartments from './pages/AdminDepartments';
import AdminUsers from './pages/AdminUsers';
import AdminSLA from './pages/AdminSLA';
import AdminReports from './pages/AdminReports';
import AdminServiceCatalog from './pages/AdminServiceCatalog';
import AdminServiceFields from './pages/AdminServiceFields';
import AdminApprovalStages from './pages/AdminApprovalStages';
import AdminApprovalReports from './pages/AdminApprovalReports';
import AdminApprovalKanban from './pages/AdminApprovalKanban';
import KnowledgeBase from './pages/KnowledgeBase';
import ProfilePage from './pages/ProfilePage';
import AgentPerformance from './pages/AgentPerformance';
import AdminExternalAPI from './pages/AdminExternalAPI';
import AdminSettings from './pages/AdminSettings';
import CustomerPortal from './pages/CustomerPortal';
import NotFound from './pages/NotFound';
import { CustomerChatbot } from '@/components/CustomerChatbot';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient();

function ProtectedRoute({ children, redirectRequester }: { children: React.ReactNode; redirectRequester?: boolean }) {
  const { user, loading, role } = useAuth();
  useRealtimeNotificationSound();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (redirectRequester && role === 'requester') return <Navigate to="/portal" replace />;
  return <>{children}<CustomerChatbot /></>;
}

function RequesterRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  useRealtimeNotificationSound();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SystemSettingsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/" element={<ProtectedRoute redirectRequester><Index /></ProtectedRoute>} />
                <Route path="/portal" element={<RequesterRoute><CustomerPortal /></RequesterRoute>} />
                <Route path="/tickets" element={<ProtectedRoute redirectRequester><TicketsInbox /></ProtectedRoute>} />
                <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
                <Route path="/admin/departments" element={<ProtectedRoute><AdminDepartments /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
                <Route path="/admin/sla" element={<ProtectedRoute><AdminSLA /></ProtectedRoute>} />
                <Route path="/admin/reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
                <Route path="/admin/services" element={<ProtectedRoute><AdminServiceCatalog /></ProtectedRoute>} />
                <Route path="/admin/service-fields" element={<ProtectedRoute><AdminServiceFields /></ProtectedRoute>} />
                <Route path="/admin/approval-stages" element={<ProtectedRoute><AdminApprovalStages /></ProtectedRoute>} />
                <Route path="/admin/approval-reports" element={<ProtectedRoute><AdminApprovalReports /></ProtectedRoute>} />
                <Route path="/admin/approval-kanban" element={<ProtectedRoute><AdminApprovalKanban /></ProtectedRoute>} />
                <Route path="/knowledge-base" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/admin/agent-performance" element={<ProtectedRoute><AgentPerformance /></ProtectedRoute>} />
                <Route path="/admin/external-api" element={<ProtectedRoute><AdminExternalAPI /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </SystemSettingsProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
