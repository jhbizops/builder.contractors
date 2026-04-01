import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, LogOut, Menu } from 'lucide-react';
import { GlobalizationSettingsDialog } from '@/components/GlobalizationSettingsDialog';
import { useGlobalization } from '@/contexts/GlobalizationContext';
import { BrandLogo } from '@/components/BrandLogo';
import { JOBS_CANONICAL_PATH } from '@/lib/routes';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export const Navigation: React.FC = () => {
  const [location] = useLocation();
  const { userData, logout } = useAuth();
  const [currentView, setCurrentView] = useState<string>(userData?.role || 'sales');
  const { settings } = useGlobalization();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getNavItems = () => {
    const items: { path: string; label: string; roles: string[]; entitlement?: string }[] = [
      { path: '/dashboard', label: 'Dashboard', roles: ['sales', 'builder', 'admin', 'super_admin', 'dual'] },
      { path: '/dashboard/sales', label: 'Leads', roles: ['sales', 'dual', 'admin', 'super_admin'] },
      { path: '/dashboard/builder', label: 'Services', roles: ['builder', 'dual', 'admin', 'super_admin'] },
      { path: JOBS_CANONICAL_PATH, label: 'Job Board', roles: ['builder', 'dual', 'admin', 'super_admin'] },
      { path: '/dashboard/admin', label: 'Admin', roles: ['admin', 'super_admin'] },
      { path: '/dashboard/reports', label: 'Reports', roles: ['sales', 'builder', 'dual', 'admin', 'super_admin'], entitlement: 'reports.export' },
      { path: '/dashboard/billing', label: 'Billing', roles: ['sales', 'builder', 'dual', 'admin', 'super_admin'] },
    ];

    const isAdmin = userData?.role === 'admin' || userData?.role === 'super_admin';
    return items.filter(item =>
      (item.roles.includes(userData?.role || '') || isAdmin)
      && (!item.entitlement || userData?.entitlements.includes(item.entitlement))
    );
  };

  const getRoleOptions = () => {
    if (userData?.role === 'dual') {
      return [
        { value: 'sales', label: 'Sales View' },
        { value: 'builder', label: 'Builder View' },
      ];
    }
    if (userData?.role === 'admin' || userData?.role === 'super_admin') {
      return [
        { value: 'admin', label: 'Admin View' },
        { value: 'sales', label: 'Sales View' },
        { value: 'builder', label: 'Builder View' },
      ];
    }
    return [];
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 sm:py-6 gap-2">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 mt-2">
              <Link href="/dashboard">
                <span className="inline-flex items-center p-3 rounded-lg hover:bg-slate-50 transition-colors" aria-label="Builder.Contractors dashboard">
                  <BrandLogo size="sm" className="cursor-pointer" alt="Builder.Contractors dashboard" />
                </span>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {getNavItems().map((item) => (
                  <Link key={item.path} href={item.path}>
                    <span
                      className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                        location === item.path
                          ? 'bg-primary text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {getRoleOptions().length > 0 && (
              <div className="hidden md:block">
                <Select value={currentView} onValueChange={setCurrentView}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getRoleOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <div className="hidden lg:flex flex-col items-end mr-2 text-xs text-muted-foreground">
                <span>
                  {settings.locale} · {settings.currency}
                </span>
                <span>{settings.timeZone}</span>
              </div>
              <GlobalizationSettingsDialog />
              <span className="text-sm text-slate-600 hidden sm:block max-w-[180px] truncate">
                {userData?.email}
              </span>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" className="p-2" aria-label="Account">
                  <User className="h-4 w-4 text-slate-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="p-2"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4 text-slate-600" />
                </Button>
              </div>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open navigation menu"
                  data-testid="button-dashboard-mobile-menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                  <SheetDescription>Open dashboard sections and account controls.</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    {getNavItems().map((item) => (
                      <Link key={item.path} href={item.path}>
                        <span
                          className={`block rounded-md px-3 py-2 text-sm font-medium cursor-pointer transition-colors ${
                            location === item.path ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {item.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                  {getRoleOptions().length > 0 && (
                    <Select value={currentView} onValueChange={setCurrentView}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getRoleOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{settings.locale} · {settings.currency}</p>
                    <p>{settings.timeZone}</p>
                    {userData?.email ? <p className="truncate">{userData.email}</p> : null}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
