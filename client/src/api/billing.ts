import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { publicUserSchema } from "./users";
import type { BillingPlan, PlanQuota, Subscription } from "@/types";

const planSchema = publicUserSchema.shape.plan;

const subscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  planId: z.string(),
  status: z.string(),
  currentPeriodEnd: z.union([z.date(), z.string(), z.null()]).transform((value) => {
    if (value === null) return null;
    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }),
  cancelAtPeriodEnd: z.boolean(),
  provider: z.string(),
  providerCustomerId: z.string().nullable(),
  providerSubscriptionId: z.string().nullable(),
  metadata: z.record(z.string(), z.string()),
});

export const planResponseSchema = z.object({ plans: z.array(planSchema) });

const subscriptionResponseSchema = z.object({
  subscription: subscriptionSchema.nullable(),
  plan: planSchema,
  entitlements: z.array(z.string()),
  quotas: z.object({
    leads: z.number(),
    seats: z.number(),
    storageGb: z.number().optional(),
    workspaces: z.number().optional(),
  }),
});

const checkoutResponseSchema = z.object({ url: z.string().url() });

export async function fetchPlans(): Promise<BillingPlan[]> {
  const res = await apiRequest("GET", "/api/billing/plans");
  const json = await res.json();
  const parsed = planResponseSchema.parse(json);
  return parsed.plans.map(mapPlan);
}

export async function fetchSubscription(): Promise<{
  subscription: Subscription | null;
  plan: BillingPlan;
  entitlements: string[];
  quotas: PlanQuota;
}> {
  const res = await apiRequest("GET", "/api/billing/subscription");
  const json = await res.json();
  const parsed = subscriptionResponseSchema.parse(json);
  return {
    subscription: parsed.subscription ? mapSubscription(parsed.subscription) : null,
    plan: mapPlan(parsed.plan),
    entitlements: parsed.entitlements,
    quotas: parsed.quotas,
  };
}

export async function startCheckout(planId: string, successUrl: string, cancelUrl: string): Promise<string> {
  const res = await apiRequest("POST", "/api/billing/checkout", { planId, successUrl, cancelUrl });
  const json = await res.json();
  const parsed = checkoutResponseSchema.parse(json);
  return parsed.url;
}

export async function cancelSubscription(): Promise<Subscription | null> {
  const res = await apiRequest("POST", "/api/billing/cancel", {});
  const json = await res.json();
  const parsed = subscriptionResponseSchema.shape.subscription.parse(json.subscription ?? null);
  return parsed ? mapSubscription(parsed) : null;
}

function mapPlan(plan: z.infer<typeof planSchema>): BillingPlan {
  return {
    ...plan,
    description: plan.description ?? undefined,
  };
}

function mapSubscription(subscription: z.infer<typeof subscriptionSchema>): Subscription {
  return {
    ...subscription,
  };
}
