import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChurch } from "@/hooks/useChurch";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Settings from "./pages/Settings";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthenticatedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { hasChurch, loading: churchLoading } = useChurch(user?.id);

  console.log('🛡️ ProtectedRoute check:', {
    user: !!user,
    loading,
    churchLoading,
    hasChurch,
    userId: user?.id
  });

  if (loading || churchLoading) {
    console.log('⏳ ProtectedRoute: Loading auth or church data...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    console.log('🚫 ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If user doesn't have a church, redirect to onboarding
  if (!hasChurch) {
    console.log('⚠️ ProtectedRoute: No church found, redirecting to onboarding');
    return <Navigate to="/onboarding" replace />;
  }

  console.log('✅ ProtectedRoute: Access granted');
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route
            path="/onboarding"
            element={
              <AuthenticatedRoute>
                <Onboarding />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/library"
            element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
