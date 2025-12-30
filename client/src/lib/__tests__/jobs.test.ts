import { describe, expect, it } from "vitest";
import type { Job } from "@shared/schema";
import type { User } from "@/types";
import { deriveJobFacets, filterJobs, jobPermissions } from "../jobs";

const baseJob: Job = {
  id: "job_base",
  title: "Base",
  description: null,
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
