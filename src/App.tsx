import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useRealtimeNotificationSound } from '@/hooks/useRealtimeNotificationSound';
import { ThemeProvider } from '@/hooks/useTheme';
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
import KnowledgeBase from './pages/KnowledgeBase';
import ProfilePage from './pages/ProfilePage';
import AgentPerformance from './pages/AgentPerformance';
import AdminExternalAPI from './pages/AdminExternalAPI';
import NotFound from './pages/NotFound';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/tickets" element={<ProtectedRoute><TicketsInbox /></ProtectedRoute>} />
              <Route path="/tickets/new" element={<ProtectedRoute><NewTicket /></ProtectedRoute>} />
              <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
              <Route path="/admin/departments" element={<ProtectedRoute><AdminDepartments /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/sla" element={<ProtectedRoute><AdminSLA /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
              <Route path="/admin/services" element={<ProtectedRoute><AdminServiceCatalog /></ProtectedRoute>} />
              <Route path="/admin/service-fields" element={<ProtectedRoute><AdminServiceFields /></ProtectedRoute>} />
              <Route path="/admin/approval-stages" element={<ProtectedRoute><AdminApprovalStages /></ProtectedRoute>} />
              <Route path="/knowledge-base" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/admin/agent-performance" element={<ProtectedRoute><AgentPerformance /></ProtectedRoute>} />
              <Route path="/admin/external-api" element={<ProtectedRoute><AdminExternalAPI /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
