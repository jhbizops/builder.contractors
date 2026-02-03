import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFormDialog } from "@/components/jobs/JobFormDialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  claimJob,
  createJob,
  createJobActivity,
  fetchJobs,
  jobsKeyRoot,
  jobsQueryKey,
  setJobStatus,
  type CreateJobPayload,
} from "@/api/jobs";
import { deriveJobFacets, deriveJobInsights, jobPermissions } from "@/lib/jobs";
import type { Job } from "@shared/schema";

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function JobBoard() {
  const { userData } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: "open", region: "all", trade: "all", scope: "all" });
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const permissions = jobPermissions(userData ?? null);

  const scopeFilters = useMemo(() => {
    if (filters.scope === "owned" && userData?.id) {
      return { ownerId: userData.id };
    }
    if (filters.scope === "assigned" && userData?.id) {
      return { assigneeId: userData.id };
    }
    return {};
  }, [filters.scope, userData?.id]);

  const apiFilters = useMemo(
    () => ({
      status: filters.status === "all" ? undefined : filters.status,
      region: filters.region === "all" ? undefined : filters.region,
      trade: filters.trade === "all" ? undefined : filters.trade,
      ...scopeFilters,
    }),
    [filters, scopeFilters],
  );

  const { data: jobs = [], isPending } = useQuery({
    queryKey: jobsQueryKey(apiFilters),
    queryFn: () => fetchJobs(apiFilters),
  });

  const facets = useMemo(() => deriveJobFacets(jobs), [jobs]);
  const insights = useMemo(() => deriveJobInsights(jobs), [jobs]);
  const hasActiveFilters = Object.values(filters).some((value) => value !== "all");

  const createJobMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsKeyRoot });
      toast({ title: "Job posted", description: "Your job is now visible on the board." });
      setIsJobDialogOpen(false);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to post job";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const claimJobMutation = useMutation({
    mutationFn: (id: string) => claimJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsKeyRoot });
      toast({ title: "Job claimed", description: "The job is now assigned to you." });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to claim job";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Job["status"] }) => setJobStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsKeyRoot });
      toast({ title: "Status updated", description: "Job status updated." });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to update job status";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const requestCollaborationMutation = useMutation({
    mutationFn: (id: string) =>
      createJobActivity(id, {
        note: `Collaboration requested by ${userData?.email ?? "builder"}`,
        kind: "collaboration_request",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsKeyRoot });
      toast({ title: "Request sent", description: "The owner has been notified." });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to request collaboration";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const handlePostJob = async (payload: CreateJobPayload) => {
    await createJobMutation.mutateAsync(payload);
  };

  const handleClaim = async (jobId: string) => {
    if (!permissions.canClaim) {
      toast({ title: "Not allowed", description: permissions.reason ?? "Approval required", variant: "destructive" });
      return;
    }
    await claimJobMutation.mutateAsync(jobId);
  };

  const handleRequestCollaboration = async (jobId: string) => {
    if (!permissions.canCollaborate) {
      toast({ title: "Not allowed", description: permissions.reason ?? "Approval required", variant: "destructive" });
      return;
    }
    await requestCollaborationMutation.mutateAsync(jobId);
  };

  const handleStatusChange = async (jobId: string, status: Job["status"]) => {
    if (!permissions.canCollaborate) {
      toast({ title: "Not allowed", description: permissions.reason ?? "Approval required", variant: "destructive" });
      return;
    }
    await statusMutation.mutateAsync({ id: jobId, status });
  };

  const approvalBadge = permissions.isApproved ? (
    <Badge className="bg-emerald-100 text-emerald-700">Approved builder</Badge>
  ) : (
    <Badge className="bg-amber-100 text-amber-700">Awaiting approval</Badge>
  );

  return (
    <ProtectedRoute requiredRole={['builder', 'dual', 'admin', 'super_admin']} requireApproval={false}>
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Job Board</h2>
              <p className="text-slate-600">
                Trade-only workspace for posting, allocating, and collaborating on live jobs.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {approvalBadge}
              <Button onClick={() => setIsJobDialogOpen(true)} disabled={!permissions.canPost}>
                Post a job
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Open jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-slate-900">{insights.open}</p>
                <p className="text-xs text-slate-500">Ready to allocate: {insights.readyToAllocate}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Unassigned</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-slate-900">{insights.unassigned}</p>
                <p className="text-xs text-slate-500">Awaiting trade pickup</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Active allocations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-slate-900">{insights.inProgress}</p>
                <p className="text-xs text-slate-500">In progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-slate-900">{insights.tradeCoverage}</p>
                <p className="text-xs text-slate-500">{insights.regionCoverage} regions live</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Allocation workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <ol className="list-decimal pl-4 space-y-2">
                  <li>Post trade-specific jobs with clear scope, region, and timing.</li>
                  <li>Trades claim or request collaboration to join the allocation.</li>
                  <li>Owners confirm assignments and move work into progress.</li>
                </ol>
                <p className="text-xs text-slate-500">
                  Only verified builders can allocate. Collaboration requests notify owners instantly.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Trade standards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p>Keep allocations trade-only, with no consumer-facing data.</p>
                <p>Use collaboration requests for multi-trade scopes.</p>
                <p>Confirm assignments before work starts.</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                value={filters.scope}
                onValueChange={(value) => setFilters((current) => ({ ...current, scope: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All jobs</SelectItem>
                  <SelectItem value="owned">Owned by me</SelectItem>
                  <SelectItem value="assigned">Assigned to me</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.trade}
                onValueChange={(value) => setFilters((current) => ({ ...current, trade: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Trade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All trades</SelectItem>
                  {facets.trades.map((trade) => (
                    <SelectItem key={trade} value={trade}>
                      {trade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.region}
                onValueChange={(value) => setFilters((current) => ({ ...current, region: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All regions</SelectItem>
                  {facets.regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((current) => ({ ...current, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 md:col-span-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFilters({ status: "open", region: "all", trade: "all", scope: "all" })}
                  disabled={!hasActiveFilters}
                >
                  Reset filters
                </Button>
                {hasActiveFilters && (
                  <span className="text-xs text-slate-500">Showing filtered trade allocations.</span>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isPending ? (
              <p className="text-sm text-slate-500">Loading jobs...</p>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-slate-500">No jobs match your filters.</p>
            ) : (
              jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  currentUserId={userData?.id}
                  canClaim={permissions.canClaim}
                  canCollaborate={permissions.canCollaborate}
                  canManageStatus={permissions.canCollaborate}
                  disabledReason={permissions.reason}
                  isClaiming={claimJobMutation.isPending}
                  isRequesting={requestCollaborationMutation.isPending}
                  isUpdatingStatus={statusMutation.isPending}
                  onClaim={(selected) => handleClaim(selected.id)}
                  onStartJob={(selected) => handleStatusChange(selected.id, "in_progress")}
                  onCompleteJob={(selected) => handleStatusChange(selected.id, "completed")}
                  onRequestCollaboration={(selected) => handleRequestCollaboration(selected.id)}
                />
              ))
            )}
          </div>
        </div>

        <JobFormDialog
          open={isJobDialogOpen}
          onOpenChange={setIsJobDialogOpen}
          onSubmit={handlePostJob}
          isSubmitting={createJobMutation.isPending}
          disableSubmit={!permissions.canPost}
          disableReason={permissions.reason}
        />
      </div>
    </ProtectedRoute>
  );
}
