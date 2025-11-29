import type { InsertBillingPlan, PlanQuota } from "./schema";

function quotas(values: PlanQuota): PlanQuota {
  return values;
}

export const defaultBillingPlans: InsertBillingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Get started with core dashboards and limited leads.",
    interval: "month",
    priceCents: 0,
    currency: "usd",
    entitlements: ["dashboard.basic"],
    quotas: quotas({ leads: 50, seats: 1, storageGb: 1, workspaces: 1 }),
    isDefault: true,
    providerPriceId: null,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Unlock automation, exports, and richer dashboards.",
    interval: "month",
    priceCents: 6900,
    currency: "usd",
    entitlements: ["dashboard.basic", "billing.paid", "reports.export", "leads.routing"],
    quotas: quotas({ leads: 5000, seats: 5, storageGb: 25, workspaces: 3 }),
    isDefault: false,
    providerPriceId: null,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Priority support with custom quotas and SSO hooks.",
    interval: "month",
    priceCents: 21900,
    currency: "usd",
    entitlements: [
      "dashboard.basic",
      "billing.paid",
      "reports.export",
      "leads.routing",
      "analytics.enterprise",
      "support.priority",
    ],
    quotas: quotas({ leads: 50000, seats: 20, storageGb: 200, workspaces: 10 }),
    isDefault: false,
    providerPriceId: null,
  },
];
