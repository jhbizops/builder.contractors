import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
  requireApproval?: boolean;
  requiredEntitlement?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = [],
  requireApproval = true,
  requiredEntitlement,
}) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Redirect to="/login" />;
  }

  if (!userData) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-slate-900">Profile Error</h1>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Unable to load user profile. Please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAdmin = userData.role === 'admin' || userData.role === 'super_admin';

  if (requiredEntitlement && !userData.entitlements.includes(requiredEntitlement)) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-slate-900">Upgrade required</h1>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              This area needs a premium entitlement. Visit billing to upgrade your plan.
            </p>
            <div className="mt-6 text-center">
              <a
                href="/dashboard/billing"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Go to Billing
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requireApproval && !isAdmin && !userData.approved) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <h1 className="text-2xl font-bold text-slate-900">Pending Approval</h1>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Your account is pending admin approval. Please wait for confirmation.
            </p>
            <div className="mt-6 text-center">
              <a 
                href="/logout" 
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Sign out and try a different account
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requiredRole.length > 0 && !requiredRole.includes(userData.role) && userData.role !== 'dual' && !isAdmin) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
