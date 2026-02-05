import { describe, expect, it } from "vitest";
import type { Job } from "@shared/schema";
import type { User } from "@/types";
import {
  deriveJobFacets,
  deriveJobInsights,
  deriveJobNextStep,
  deriveJobReadiness,
  filterJobs,
  jobPermissions,
} from "../jobs";

const baseJob: Job = {
  id: "job_base",
  title: "Base",
  description: null,
  privateDetails: null,
  status: "open",
  ownerId: "owner-1",
  assigneeId: null,
  region: "apac",
  country: "AU",
  trade: "carpentry",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("jobs helpers", () => {
  it("filters jobs by status, region, and trade", () => {
    const jobs: Job[] = [
      baseJob,
      { ...baseJob, id: "job_2", status: "completed" },
      { ...baseJob, id: "job_3", region: "na", trade: "plumbing" },
    ];

    const filtered = filterJobs(jobs, { status: "open", region: "apac", trade: "carpentry" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("job_base");
  });

  it("derives unique facet lists", () => {
    const jobs: Job[] = [
      baseJob,
      { ...baseJob, id: "job_other", trade: "roofing", region: "emea" },
    ];

    const facets = deriveJobFacets(jobs);
    expect(facets.trades).toEqual(["carpentry", "roofing"]);
    expect(facets.regions).toEqual(["apac", "emea"]);
  });

  it("scores allocation readiness based on required details", () => {
    const readiness = deriveJobReadiness(baseJob);
    expect(readiness.isReady).toBe(false);
    expect(readiness.missing).toContain("Scope details");

    const readyJob = { ...baseJob, description: "Fit out and materials provided." };
    const readyState = deriveJobReadiness(readyJob);
    expect(readyState.isReady).toBe(true);
    expect(readyState.score).toBe(100);
  });

  it("summarises allocation insights across jobs", () => {
    const jobs: Job[] = [
      baseJob,
      { ...baseJob, id: "job_assigned", status: "in_progress", assigneeId: "builder-1" },
      { ...baseJob, id: "job_ready", description: "Install frames", status: "open" },
    ];

    const insights = deriveJobInsights(jobs);
    expect(insights.total).toBe(3);
    expect(insights.open).toBe(2);
    expect(insights.inProgress).toBe(1);
    expect(insights.readyToAllocate).toBe(1);
  });

  it("describes the next step based on status and ownership", () => {
    const openUnassigned = deriveJobNextStep(baseJob, "someone-else");
    expect(openUnassigned.action).toBe("claim");

    const assignedToUser = deriveJobNextStep({ ...baseJob, assigneeId: "builder-1" }, "builder-1");
    expect(assignedToUser.action).toBe("start");

    const inProgress = deriveJobNextStep(
      { ...baseJob, status: "in_progress", assigneeId: "builder-1" },
      "builder-1",
    );
    expect(inProgress.action).toBe("complete");

    const completed = deriveJobNextStep({ ...baseJob, status: "completed" }, "builder-1");
    expect(completed.action).toBeUndefined();
  });

  it("computes job permissions for different roles", () => {
    const builder: User = {
      id: "builder",
      email: "builder@example.com",
      role: "builder",
      approved: true,
      country: undefined,
      region: undefined,
      locale: undefined,
      currency: undefined,
      languages: [],
      createdAt: new Date(),
      plan: {
        id: "free",
        name: "Free",
        description: "",
        interval: "month",
        priceCents: 0,
        currency: "usd",
        entitlements: ["dashboard.basic"],
        quotas: { leads: 10, seats: 1 },
        isDefault: true,
        providerPriceId: null,
      },
      subscription: null,
      entitlements: ["dashboard.basic"],
      quotas: { leads: 10, seats: 1 },
    };

    expect(jobPermissions(builder).canClaim).toBe(true);
    expect(jobPermissions({ ...builder, approved: false }).reason).toMatch(/Awaiting/);
    expect(jobPermissions({ ...builder, role: "sales" }).canPost).toBe(false);
    expect(jobPermissions({ ...builder, role: "admin", approved: false }).canClaim).toBe(true);
  });
});
