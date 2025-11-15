import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAIL = "admin@builder.contractors";
const ADMIN_PASSWORD = "BuilderAdmin2025!";

export default function AdminSetup() {
  const { currentUser, register, login, logout } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleCreateAdmin = async () => {
    setIsCreating(true);
    try {
      await register(ADMIN_EMAIL, ADMIN_PASSWORD, "admin");
      toast({
        title: "Admin ready",
        description: "Admin account created and signed in.",
      });
    } catch (error) {
      toast({
        title: "Unable to create admin",
        description: error instanceof Error ? error.message : "Registration failed.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login(ADMIN_EMAIL, ADMIN_PASSWORD);
      toast({
        title: "Signed in as admin",
        description: "Redirecting to the admin dashboard…",
      });
      window.location.href = "/dashboard/admin";
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Authentication failed.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast({
        title: "Session cleared",
        description: "You have been signed out.",
      });
    } catch (error) {
      toast({
        title: "Unable to sign out",
        description: error instanceof Error ? error.message : "Logout failed.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <BrandLogo size="sm" className="mx-auto mb-4" alt="Builder.Contractors" />
          <CardTitle className="text-2xl font-bold text-slate-900">Admin Setup</CardTitle>
          <p className="text-slate-600 mt-2">Bootstrap or access the administrative account</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Default credentials</h3>
            <p className="text-sm text-blue-800">
              Email: <code className="bg-white px-1 rounded">{ADMIN_EMAIL}</code>
            </p>
            <p className="text-sm text-blue-800">
              Password: <code className="bg-white px-1 rounded">{ADMIN_PASSWORD}</code>
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleCreateAdmin}
              className="w-full"
              disabled={isCreating}
            >
              {isCreating ? "Creating…" : "Create Admin Account"}
            </Button>

            <Button
              onClick={handleQuickLogin}
              className="w-full"
              variant="default"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Signing in…" : "Quick Login as Admin"}
            </Button>

            <div className="pt-2 border-t">
              <Button
                onClick={handleLogout}
                className="w-full"
                variant="outline"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Signing out…" : "Sign Out"}
              </Button>
            </div>

            {currentUser && (
              <div className="pt-2">
                <Button
                  onClick={() => {
                    window.location.href = "/dashboard/admin";
                  }}
                  className="w-full"
                  variant="secondary"
                >
                  Go to Admin Dashboard
                </Button>
              </div>
            )}
          </div>

          <div className="text-center text-sm text-slate-600">
            <p>Use this page to seed or access the administrator account quickly.</p>
            <p className="mt-2">Once signed in, visit the Admin Dashboard to manage approvals.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
