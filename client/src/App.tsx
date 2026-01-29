import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { GlobalizationProvider } from "@/contexts/GlobalizationContext";
import { GlobalizationRoleSync } from "@/components/GlobalizationRoleSync";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/not-found";
import { getLocalizedMarketingPath, marketingLocales } from "@/content/locales";

// Lazy load dashboard pages to improve initial load time
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const SalesDashboard = lazy(() => import("@/pages/SalesDashboard"));
const BuilderDashboard = lazy(() => import("@/pages/BuilderDashboard"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminSetup = lazy(() => import("@/pages/AdminSetup"));
const ClearSession = lazy(() => import("@/pages/ClearSession"));
const Billing = lazy(() => import("@/pages/Billing"));
const Reports = lazy(() => import("@/pages/Reports"));
const JobBoard = lazy(() => import("@/pages/JobBoard"));
const About = lazy(() => import("@/pages/About"));
const HowItWorks = lazy(() => import("@/pages/HowItWorks"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Pricing = lazy(() => import("@/pages/Pricing"));

const marketingRoutes = [
  { slug: "/", component: Home },
  { slug: "/about", component: About },
  { slug: "/how-it-works", component: HowItWorks },
  { slug: "/faq", component: FAQ },
  { slug: "/pricing", component: Pricing },
];

// Loading placeholder
function LoadingFallback() {
  return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}

// Auto-seed admin account in development
function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/logout" component={ClearSession} />
        <Route path="/admin-setup" component={AdminSetup} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/sales" component={SalesDashboard} />
        <Route path="/dashboard/builder" component={BuilderDashboard} />
        <Route path="/dashboard/jobs" component={JobBoard} />
        <Route path="/dashboard/admin" component={AdminDashboard} />
        <Route path="/dashboard/billing" component={Billing} />
        <Route path="/dashboard/reports" component={Reports} />
        <Route path="/about" component={About} />
        <Route path="/how-it-works" component={HowItWorks} />
        <Route path="/faq" component={FAQ} />
        <Route path="/pricing" component={Pricing} />
        {marketingLocales.flatMap((locale) =>
          marketingRoutes.map((route) => (
            <Route
              key={`${locale.locale}-${route.slug}`}
              path={getLocalizedMarketingPath(locale.prefix, route.slug)}
              component={route.component}
            />
          )),
        )}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GlobalizationProvider>
          <AuthProvider>
            <GlobalizationRoleSync>
              <Toaster />
              <Router />
            </GlobalizationRoleSync>
          </AuthProvider>
        </GlobalizationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
