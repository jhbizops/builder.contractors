import React, { useMemo, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServiceManagement } from '@/components/ServiceManagement';
import { Settings, DollarSign, FileText, Wrench, Briefcase } from 'lucide-react';
import { useGlobalization } from '@/contexts/GlobalizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { EntitlementGate } from '@/components/EntitlementGate';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchServices, servicesQueryKey } from '@/api/services';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobFormDialog } from '@/components/jobs/JobFormDialog';
import { JobCollaborationList } from '@/components/jobs/JobCollaborationList';
import { jobPermissions } from '@/lib/jobs';
import {
  assignJob,
  createJob,
  fetchJobs,
  jobsKeyRoot,
  jobsQueryKey,
  setJobStatus,
  type CreateJobPayload,
} from '@/api/jobs';
import type { Job } from '@shared/schema';
import { toast } from '@/hooks/use-toast';

export default function BuilderDashboard() {
  const queryClient = useQueryClient();
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const { data: services = [] } = useQuery({
    queryKey: servicesQueryKey,
    queryFn: fetchServices,
  });
  const { formatDualCurrency, formatNumber, settings } = useGlobalization();
  const { userData } = useAuth();
  const jobAccess = jobPermissions(userData ?? null);
  const ownerFilters = useMemo(() => ({ ownerId: userData?.id ?? "" }), [userData?.id]);
  const sharedFilters = useMemo(() => ({ assigneeId: userData?.id ?? "" }), [userData?.id]);
  const { data: myJobs = [], isPending: loadingMyJobs } = useQuery({
    queryKey: jobsQueryKey(ownerFilters),
    queryFn: () => fetchJobs(ownerFilters),
    enabled: Boolean(userData?.id),
  });
  const { data: sharedJobs = [], isPending: loadingSharedJobs } = useQuery({
    queryKey: jobsQueryKey(sharedFilters),
    queryFn: () => fetchJobs(sharedFilters),
    enabled: Boolean(userData?.id),
  });
  const hasAutomation = userData?.entitlements.includes('billing.paid');
  const canExport = userData?.entitlements.includes('reports.export');
  const createJobMutation = useMutation({
    mutationFn: (payload: CreateJobPayload) => createJob(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsKeyRoot });
      toast({ title: 'Job posted', description: 'Your job has been added to the board.' });
      setIsJobDialogOpen(false);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to post job';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Job['status'] }) => setJobStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jobsKeyRoot }),
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to update job status';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });
  const assignMutation = useMutation({
    mutationFn: ({ id, assigneeId }: { id: string; assigneeId: string | null }) => assignJob(id, assigneeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jobsKeyRoot }),
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to assign job';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  const stats = {
    totalServices: services.length,
    activeServices: services.filter(s => s.active).length,
    avgPrice: services.length > 0 
      ? Math.round(services.reduce((sum, s) => sum + s.basePrice, 0) / services.length)
      : 0,
  };
  const isAdmin = userData?.role === 'admin' || userData?.role === 'super_admin';

  const handleJobSubmit = async (payload: CreateJobPayload) => {
    await createJobMutation.mutateAsync(payload);
  };

  const handleStatusChange = async (jobId: string, status: Job['status']) => {
    if (!jobAccess.canCollaborate) {
      toast({
        title: 'Not allowed',
        description: jobAccess.reason ?? 'Builder approval required',
        variant: 'destructive',
      });
      return;
    }
    await updateStatusMutation.mutateAsync({ id: jobId, status });
  };

  const handleAssign = async (job: Job, assigneeId: string | null) => {
    if (!userData) return;
    if (!jobAccess.canCollaborate || (!isAdmin && job.ownerId !== userData.id)) {
      toast({
        title: 'Not allowed',
        description: 'Only job owners or admins can assign collaborators.',
        variant: 'destructive',
      });
      return;
    }
    await assignMutation.mutateAsync({ id: job.id, assigneeId });
  };

  const canAssignJob = (job: Job) => jobAccess.canCollaborate && (isAdmin || job.ownerId === userData?.id);
  const canInviteJob = (job: Job) => jobAccess.canCollaborate && (isAdmin || job.ownerId === userData?.id);

  return (
    <ProtectedRoute requiredRole={['builder', 'dual']}>
      <div className="min-h-screen bg-slate-50">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Builder Dashboard</h2>
                <p className="text-slate-600 mt-1">
                  Manage services, pricing, and project details · Displaying {settings.currency} pricing
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={jobAccess.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                  {jobAccess.isApproved ? 'Approved' : 'Pending approval'}
                </Badge>
                <Button size="sm" onClick={() => setIsJobDialogOpen(true)} disabled={!jobAccess.canPost}>
                  <Briefcase className="h-4 w-4 mr-2" />
                  Post a job
                </Button>
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
                    <p className="text-2xl font-bold text-slate-900">{formatDualCurrency(stats.avgPrice)}</p>
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
                  <EntitlementGate
                    entitlement="billing.paid"
                    fallbackText="Bookings and automation are available on Pro plans."
                  >
                    <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                      <h4 className="font-medium text-slate-900">Booking Form</h4>
                      <p className="text-sm text-slate-600 mb-2">Generate booking links with reminders.</p>
                      <button className="text-primary text-sm font-medium hover:text-blue-700">
                        Create Link
                      </button>
                    </div>
                  </EntitlementGate>

                  {canExport ? (
                    <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                      <h4 className="font-medium text-slate-900">Download Price List</h4>
                      <p className="text-sm text-slate-600 mb-2">Export current pricing for clients</p>
                      <button className="text-primary text-sm font-medium hover:text-blue-700">
                        Download PDF
                      </button>
                    </div>
                  ) : (
                    <EntitlementGate
                      entitlement="reports.export"
                      fallbackText="Exports unlock with Pro or Enterprise."
                    >
                      <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                        <h4 className="font-medium text-slate-900">Download Price List</h4>
                        <p className="text-sm text-slate-600 mb-2">Export current pricing for clients</p>
                        <button className="text-primary text-sm font-medium hover:text-blue-700">
                          Download PDF
                        </button>
                      </div>
                    </EntitlementGate>
                  )}

                  {hasAutomation ? (
                    <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                      <h4 className="font-medium text-slate-900">Custom Pricing</h4>
                      <p className="text-sm text-slate-600 mb-2">Set special rates for specific clients</p>
                      <button className="text-primary text-sm font-medium hover:text-blue-700">
                        Manage Pricing
                      </button>
                    </div>
                  ) : (
                    <EntitlementGate
                      entitlement="billing.paid"
                      fallbackText="Client-specific pricing is part of Pro."
                    >
                      <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                        <h4 className="font-medium text-slate-900">Custom Pricing</h4>
                        <p className="text-sm text-slate-600 mb-2">Set special rates for specific clients</p>
                        <button className="text-primary text-sm font-medium hover:text-blue-700">
                          Manage Pricing
                        </button>
                      </div>
                    </EntitlementGate>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-slate-600" />
                <div>
                  <CardTitle>Jobs</CardTitle>
                  <p className="text-xs text-muted-foreground">Track ownership, assignments, files, and comments.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="mine">
                <TabsList className="mb-4">
                  <TabsTrigger value="mine">My jobs</TabsTrigger>
                  <TabsTrigger value="shared">Shared with me</TabsTrigger>
                </TabsList>
                <TabsContent value="mine">
                  <JobCollaborationList
                    jobs={myJobs}
                    isLoading={loadingMyJobs}
                    canManage={jobAccess.canCollaborate}
                    permissionReason={jobAccess.reason}
                    currentUserId={userData?.id}
                    onStatusChange={handleStatusChange}
                    onAssignToMe={(job, assigneeId) => handleAssign(job, assigneeId)}
                    canAssign={canAssignJob}
                    canInvite={canInviteJob}
                  />
                </TabsContent>
                <TabsContent value="shared">
                  <JobCollaborationList
                    jobs={sharedJobs}
                    isLoading={loadingSharedJobs}
                    canManage={jobAccess.canCollaborate}
                    permissionReason={jobAccess.reason}
                    currentUserId={userData?.id}
                    onStatusChange={handleStatusChange}
                    onAssignToMe={(job, assigneeId) => handleAssign(job, assigneeId)}
                    canAssign={canAssignJob}
                    canInvite={canInviteJob}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      <JobFormDialog
        open={isJobDialogOpen}
        onOpenChange={setIsJobDialogOpen}
        onSubmit={handleJobSubmit}
        isSubmitting={createJobMutation.isPending}
        disableSubmit={!jobAccess.canPost}
        disableReason={jobAccess.reason}
      />
    </ProtectedRoute>
  );
}
