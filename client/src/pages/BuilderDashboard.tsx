import React from 'react';
import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceManagement } from '@/components/ServiceManagement';
import { Settings, DollarSign, FileText, Wrench } from 'lucide-react';
import { useServices } from '@/hooks/api/useServices';
import { Service } from '@/types';
import { useGlobalization } from '@/contexts/GlobalizationContext';

export default function BuilderDashboard() {
  const { data: services } = useServices();
  const { formatCurrency, formatNumber, settings } = useGlobalization();

  const stats = {
    totalServices: services.length,
    activeServices: services.filter(s => s.active).length,
    avgPrice: services.length > 0 
      ? Math.round(services.reduce((sum, s) => sum + s.basePrice, 0) / services.length)
      : 0,
  };

  return (
    <ProtectedRoute requiredRole={['builder', 'dual']}>
      <div className="min-h-screen bg-slate-50">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Builder Dashboard</h2>
                <p className="text-slate-600 mt-1">
                  Manage services, pricing, and project details · Displaying {settings.currency} pricing
                </p>
              </div>
            </div>
          </div>

          {/* Dashboard Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <Wrench className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Total Services</p>
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(stats.totalServices)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <Settings className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Active Services</p>
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(stats.activeServices)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Avg Price</p>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.avgPrice)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Price Lists</p>
                    <p className="text-2xl font-bold text-slate-900">3</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Service Management */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ServiceManagement />
            </div>
            
            {/* Quick Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-900">Download Price List</h4>
                    <p className="text-sm text-slate-600 mb-2">Export current pricing for clients</p>
                    <button className="text-primary text-sm font-medium hover:text-blue-700">
                      Download PDF
                    </button>
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-900">Booking Form</h4>
                    <p className="text-sm text-slate-600 mb-2">Generate booking link for clients</p>
                    <button className="text-primary text-sm font-medium hover:text-blue-700">
                      Create Link
                    </button>
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-900">Custom Pricing</h4>
                    <p className="text-sm text-slate-600 mb-2">Set special rates for specific clients</p>
                    <button className="text-primary text-sm font-medium hover:text-blue-700">
                      Manage Pricing
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
