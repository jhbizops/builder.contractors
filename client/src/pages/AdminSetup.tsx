import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandLogo } from '@/components/BrandLogo';
import { seedAdminAccount } from '@/lib/seedAdmin';
import { loginLocalUser, getStoredLocalUsers, isLocalAuthAvailable } from '@/lib/localAuth';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function AdminSetup() {
  const [isCreating, setIsCreating] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [adminExists, setAdminExists] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Comment out auto-redirect to allow manual control
  // if (currentUser?.email === 'admin@builder.contractors') {
  //   return <Redirect to="/dashboard/admin" />;
  // }

  const checkAdminExists = () => {
    if (!isLocalAuthAvailable) {
      toast({
        title: 'Error',
        description: 'Local authentication is not available',
        variant: 'destructive',
      });
      return;
    }
    
    const users = getStoredLocalUsers();
    const hasAdmin = users.some((u: any) => u.email.toLowerCase() === 'admin@builder.contractors');
    setAdminExists(hasAdmin);
    
    if (hasAdmin) {
      toast({
        title: 'Admin Found',
        description: 'Admin account exists. You can login with the credentials.',
      });
    } else {
      toast({
        title: 'No Admin',
        description: 'Admin account does not exist. Click "Create Admin" to set it up.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateAdmin = async () => {
    setIsCreating(true);
    try {
      const result = await seedAdminAccount();
      if (result) {
        toast({
          title: 'Success',
          description: `Admin created! Email: ${result.email} Password: ${result.password}`,
        });
        setAdminExists(true);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickLogin = async () => {
    setIsLoggingIn(true);
    try {
      const user = await loginLocalUser('admin@builder.contractors', 'BuilderAdmin2025!');
      
      // Store in localStorage
      localStorage.setItem('bc_local_auth_session_v1', JSON.stringify({
        userId: user.id,
        timestamp: Date.now()
      }));
      
      toast({
        title: 'Success',
        description: 'Logged in as admin! Redirecting...',
      });
      
      // Force reload to trigger auth context
      window.location.href = '/dashboard/admin';
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleClearSession = () => {
    localStorage.removeItem('bc_local_auth_session_v1');
    localStorage.removeItem('bc_local_auth_current_user');
    toast({
      title: 'Session Cleared',
      description: 'You have been logged out.',
    });
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <BrandLogo size="sm" className="mx-auto mb-4" alt="Builder.Contractors" />
          <CardTitle className="text-2xl font-bold text-slate-900">Admin Setup</CardTitle>
          <p className="text-slate-600 mt-2">Quick Admin Account Management</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Admin Credentials</h3>
            <p className="text-sm text-blue-800">
              Email: <code className="bg-white px-1 rounded">admin@builder.contractors</code>
            </p>
            <p className="text-sm text-blue-800">
              Password: <code className="bg-white px-1 rounded">BuilderAdmin2025!</code>
            </p>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={checkAdminExists}
              className="w-full"
              variant="outline"
            >
              Check Admin Status
            </Button>

            <Button 
              onClick={handleCreateAdmin}
              className="w-full"
              disabled={isCreating || adminExists}
            >
              {isCreating ? 'Creating...' : 'Create Admin Account'}
            </Button>

            <Button 
              onClick={handleQuickLogin}
              className="w-full"
              variant="default"
              disabled={isLoggingIn || !adminExists}
            >
              {isLoggingIn ? 'Logging in...' : 'Quick Login as Admin'}
            </Button>

            <div className="pt-2 border-t">
              <Button 
                onClick={handleClearSession}
                className="w-full"
                variant="destructive"
              >
                Clear Session (Logout)
              </Button>
            </div>

            {currentUser && (
              <div className="pt-2">
                <Button 
                  onClick={() => window.location.href = '/dashboard/admin'}
                  className="w-full"
                  variant="secondary"
                >
                  Go to Admin Dashboard
                </Button>
              </div>
            )}
          </div>

          <div className="text-center text-sm text-slate-600">
            <p>Use this page to:</p>
            <ul className="text-left mt-2 space-y-1">
              <li>• Check if admin account exists</li>
              <li>• Create admin account if missing</li>
              <li>• Quick login as admin</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}