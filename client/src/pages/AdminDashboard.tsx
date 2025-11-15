import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserApprovalPanel } from '@/components/UserApprovalPanel';
import { ServiceManagement } from '@/components/ServiceManagement';
import { LeadCard } from '@/components/LeadCard';
import { LeadModal } from '@/components/modals/LeadModal';
import { Plus, Download, Users, Handshake, Clock, TrendingUp, FileSpreadsheet } from 'lucide-react';
import { Lead, User, Service, AdminMetrics } from '@/types';
import { useCollection } from '@/hooks/useCollection';
import { useGlobalization } from '@/contexts/GlobalizationContext';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const { data: leads, update, remove } = useCollection<Lead>('leads');
  const { data: users } = useCollection<User>('users');
  const { data: services } = useCollection<Service>('services');
  const { formatCurrency, formatNumber } = useGlobalization();
  const {
    data: metrics,
    error: metricsError,
  } = useQuery<AdminMetrics>({
    queryKey: ['/api/admin/metrics'],
    retry: false,
  });

  useEffect(() => {
    if (metricsError && metricsError instanceof Error) {
      toast({
        title: 'Unable to load metrics',
        description: metricsError.message,
        variant: 'destructive',
      });
    }
  }, [metricsError]);

  const isSameMonth = (value: Date, reference: Date) =>
    value.getFullYear() === reference.getFullYear() &&
    value.getMonth() === reference.getMonth();

  const fallbackStats = useMemo<AdminMetrics>(() => {
    const now = new Date();
    const leadsByStatus: Record<Lead['status'], number> = {
      new: 0,
      in_progress: 0,
      completed: 0,
      on_hold: 0,
    };

    leads.forEach((lead) => {
      leadsByStatus[lead.status] = (leadsByStatus[lead.status] ?? 0) + 1;
    });

    const approvedUsers = users.filter((user) => user.approved).length;
    const monthlyLeadVolume = leads.filter((lead) => isSameMonth(lead.createdAt, now)).length;

    return {
      totalUsers: users.length,
      approvedUsers,
      pendingApprovals: Math.max(users.length - approvedUsers, 0),
      totalLeads: leads.length,
      leadsByStatus,
      monthlyLeadVolume,
      monthlyRevenue: 0,
      averageDealSize: 0,
      serviceCount: services.length,
      activeServiceCount: services.filter((service) => service.active).length,
    };
  }, [leads, services, users]);

  const stats = metrics ?? fallbackStats;

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    try {
      await apiRequest('DELETE', `/api/leads/${encodeURIComponent(id)}`);
      await remove(id, { silent: true });
      toast({ title: 'Lead deleted', description: 'The lead has been removed.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete lead';
      toast({ title: 'Deletion failed', description: message, variant: 'destructive' });
    }
  };

  const handleSaveLead = async (leadData: Partial<Lead>) => {
    if (!selectedLead) return;
    
    try {
      await update(selectedLead.id, leadData);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const recentLeads = leads.slice(0, 5); // Show only 5 most recent

  return (
    <ProtectedRoute requiredRole={['admin']}>
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
                <p className="text-slate-600 mt-1">Manage users, leads, and platform settings</p>
              </div>
              <div className="flex space-x-3">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Lead
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <a
                        href="/api/admin/export/leads.csv"
                        download
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Leads (CSV)
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href="/api/admin/export/leads.xlsx"
                        download
                        className="flex items-center gap-2"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Leads (Excel)
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href="/api/admin/export/services.csv"
                        download
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Services (CSV)
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href="/api/admin/export/services.xlsx"
                        download
                        className="flex items-center gap-2"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Services (Excel)
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Dashboard Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Total Users</p>
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(stats.totalUsers)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <Handshake className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Active Leads</p>
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(stats.leadsByStatus.in_progress)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Pending Approvals</p>
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(stats.pendingApprovals)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatCurrency(stats.monthlyRevenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Lead Management */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Leads</CardTitle>
                  <CardDescription>
                    Monthly lead volume: {formatNumber(stats.monthlyLeadVolume)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentLeads.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No leads found</p>
                  ) : (
                    <div className="space-y-4">
                      {recentLeads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          onView={handleViewLead}
                          onEdit={handleEditLead}
                          onDelete={handleDeleteLead}
                        />
                      ))}
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-slate-200 mt-6">
                    <button className="text-primary text-sm font-medium hover:text-blue-700">
                      View all leads →
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column: User Management & Quick Actions */}
            <div className="space-y-6">
              <UserApprovalPanel />
              <ServiceManagement />
            </div>
          </div>
        </div>

        {/* Lead Detail Modal */}
        <LeadModal
          lead={selectedLead}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={handleSaveLead}
        />
      </div>
    </ProtectedRoute>
  );
}
