import type { Job } from "@shared/schema";
import type { User } from "@/types";

export type JobFilterState = {
  status?: string;
  region?: string;
  trade?: string;
};

export function filterJobs(jobs: Job[], filters: JobFilterState): Job[] {
  const normalizedStatus = filters.status && filters.status !== "all" ? filters.status : undefined;
  const normalizedRegion = filters.region && filters.region !== "all" ? filters.region : undefined;
  const normalizedTrade = filters.trade && filters.trade !== "all" ? filters.trade : undefined;

  return jobs.filter((job) => {
    if (normalizedStatus && job.status !== normalizedStatus) return false;
    if (normalizedRegion && job.region !== normalizedRegion) return false;
    if (normalizedTrade && job.trade !== normalizedTrade) return false;
    return true;
  });
}

export function deriveJobFacets(jobs: Job[]): { trades: string[]; regions: string[] } {
  const trades = new Set<string>();
  const regions = new Set<string>();

  jobs.forEach((job) => {
    if (job.trade) trades.add(job.trade);
    if (job.region) regions.add(job.region);
  });

  return {
    trades: Array.from(trades).sort(),
    regions: Array.from(regions).sort(),
  };
}

export function jobPermissions(user: User | null): {
  canPost: boolean;
  canClaim: boolean;
  canCollaborate: boolean;
  reason: string | null;
  isApproved: boolean;
} {
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isBuilder = user?.role === "builder" || user?.role === "dual";
  const approved = Boolean(user?.approved) || isAdmin;
  const hasAccess = (isBuilder || isAdmin) && approved;

  let reason: string | null = null;
  if (!user) {
    reason = "Sign in required";
  } else if (!isBuilder && !isAdmin) {
    reason = "Builder or admin access required";
  } else if (!approved) {
    reason = "Awaiting builder approval";
  }

  return {
    canPost: hasAccess,
    canClaim: hasAccess,
    canCollaborate: hasAccess,
    reason,
    isApproved: approved,
  };
}
