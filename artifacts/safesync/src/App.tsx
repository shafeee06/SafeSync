import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";

// Layouts
import { UserLayout } from "@/components/layout/UserLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

// Pages
import Login from "@/pages/login";
import Register from "@/pages/register";

// User Pages
import Dashboard from "@/pages/dashboard/index";
import ComplaintsList from "@/pages/dashboard/complaints/index";
import NewComplaint from "@/pages/dashboard/complaints/new";
import ComplaintDetail from "@/pages/dashboard/complaints/detail";
import SosPage from "@/pages/dashboard/sos";
import Notifications from "@/pages/dashboard/notifications";
import Rewards from "@/pages/dashboard/rewards";

// Admin Pages
import AdminDashboard from "@/pages/admin/index";
import AdminComplaintsList from "@/pages/admin/complaints/index";
import AdminComplaintDetail from "@/pages/admin/complaints/detail";
import AuditLogs from "@/pages/admin/audit-logs";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false }: { component: any, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Redirect to="/dashboard" />;
  }

  if (!adminOnly && user.role === 'admin') {
    return <Redirect to="/admin" />;
  }

  const Layout = adminOnly ? AdminLayout : UserLayout;

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  const { user } = useAuth();
  
  return (
    <Switch>
      <Route path="/">
        {() => {
          if (user?.role === 'admin') return <ProtectedRoute component={AdminDashboard} adminOnly />;
          if (user?.role === 'user') return <ProtectedRoute component={Dashboard} />;
          return <Login />;
        }}
      </Route>
      
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* User Routes */}
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/dashboard/complaints"><ProtectedRoute component={ComplaintsList} /></Route>
      <Route path="/dashboard/complaints/new"><ProtectedRoute component={NewComplaint} /></Route>
      <Route path="/dashboard/complaints/:id"><ProtectedRoute component={ComplaintDetail} /></Route>
      <Route path="/dashboard/sos"><ProtectedRoute component={SosPage} /></Route>
      <Route path="/dashboard/notifications"><ProtectedRoute component={Notifications} /></Route>
      <Route path="/dashboard/rewards"><ProtectedRoute component={Rewards} /></Route>

      {/* Admin Routes */}
      <Route path="/admin"><ProtectedRoute component={AdminDashboard} adminOnly /></Route>
      <Route path="/admin/complaints"><ProtectedRoute component={AdminComplaintsList} adminOnly /></Route>
      <Route path="/admin/complaints/:id"><ProtectedRoute component={AdminComplaintDetail} adminOnly /></Route>
      <Route path="/admin/stats"><ProtectedRoute component={AdminDashboard} adminOnly /></Route>
      <Route path="/admin/audit-logs"><ProtectedRoute component={AuditLogs} adminOnly /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
