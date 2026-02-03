import type { Job } from "@shared/schema";
import type { User } from "@/types";

export type JobFilterState = {
  status?: string;
  region?: string;
  trade?: string;
};

export type JobReadiness = {
  missing: string[];
  isReady: boolean;
  score: number;
};

export type JobInsights = {
  total: number;
  open: number;
  unassigned: number;
  inProgress: number;
  readyToAllocate: number;
  tradeCoverage: number;
  regionCoverage: number;
};

export type JobNextStep = {
  label: string;
  description: string;
  action?: "claim" | "start" | "complete";
};

const allocationRequirements = [
  { key: "trade", label: "Trade" },
  { key: "region", label: "Region" },
  { key: "description", label: "Scope details" },
] as const;

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

export function deriveJobReadiness(job: Job): JobReadiness {
  const missing = allocationRequirements.reduce<string[]>((acc, requirement) => {
    const value = job[requirement.key];
    if (typeof value === "string" && value.trim().length > 0) {
      return acc;
    }
    if (value) {
      return acc;
    }
    acc.push(requirement.label);
    return acc;
  }, []);

  const score = Math.round(((allocationRequirements.length - missing.length) / allocationRequirements.length) * 100);

  return {
    missing,
    isReady: missing.length === 0,
    score,
  };
}

export function deriveJobInsights(jobs: Job[]): JobInsights {
  const open = jobs.filter((job) => job.status === "open");
  const inProgress = jobs.filter((job) => job.status === "in_progress");
  const unassigned = jobs.filter((job) => job.assigneeId === null);
  const readyToAllocate = open.filter((job) => deriveJobReadiness(job).isReady);
  const facets = deriveJobFacets(jobs);

  return {
    total: jobs.length,
    open: open.length,
    unassigned: unassigned.length,
    inProgress: inProgress.length,
    readyToAllocate: readyToAllocate.length,
    tradeCoverage: facets.trades.length,
    regionCoverage: facets.regions.length,
  };
}

export function deriveJobNextStep(job: Job, currentUserId?: string | null): JobNextStep {
  const isOwner = Boolean(currentUserId && job.ownerId === currentUserId);
  const isAssignee = Boolean(currentUserId && job.assigneeId === currentUserId);

  if (job.status === "completed") {
    return { label: "Complete", description: "Job marked as completed." };
  }

  if (job.status === "cancelled") {
    return { label: "Cancelled", description: "Job has been cancelled." };
  }

  if (job.status === "on_hold") {
    return { label: "On hold", description: "Job paused until updates are available." };
  }

  if (job.status === "in_progress") {
    if (isOwner || isAssignee) {
      return {
        label: "Complete job",
        description: "Mark work complete once the trade scope is done.",
        action: "complete",
      };
    }
    return { label: "In progress", description: "Work is currently underway." };
  }

  if (job.assigneeId) {
    if (isOwner || isAssignee) {
      return {
        label: "Start work",
        description: "Confirm kickoff and move the job into progress.",
        action: "start",
      };
    }
    return { label: "Assigned", description: "Awaiting owner or assignee to start." };
  }

  if (isOwner) {
    return { label: "Awaiting claim", description: "Share the job with trades or invite collaborators." };
  }

  return {
    label: "Claim job",
    description: "Claim to accept and align on timing.",
    action: "claim",
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
