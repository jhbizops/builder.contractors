import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { GlobalizationProvider } from "@/contexts/GlobalizationContext";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import SalesDashboard from "@/pages/SalesDashboard";
import BuilderDashboard from "@/pages/BuilderDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/not-found";

// Auto-seed admin account in development
import "@/lib/seedAdmin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/sales" component={SalesDashboard} />
      <Route path="/dashboard/builder" component={BuilderDashboard} />
      <Route path="/dashboard/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GlobalizationProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </GlobalizationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
