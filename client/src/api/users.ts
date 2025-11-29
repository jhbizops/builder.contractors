import { z } from "zod";
import type { BillingPlan, Subscription, User } from "@/types";
import { apiRequest } from "@/lib/queryClient";

export const USERS_QUERY_KEY = ["/api/users"] as const;

const dateSchema = z
  .union([z.string(), z.date()])
  .transform((value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid date value");
    }
    return date;
  });

export const publicUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(["sales", "builder", "admin", "dual"]),
  country: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  locale: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  languages: z.array(z.string()).default([]),
  approved: z.boolean(),
  createdAt: dateSchema,
  plan: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    interval: z.string(),
    priceCents: z.number(),
    currency: z.string(),
    entitlements: z.array(z.string()),
    quotas: z.object({
      leads: z.number(),
      seats: z.number(),
      storageGb: z.number().optional(),
      workspaces: z.number().optional(),
    }),
    isDefault: z.boolean(),
    providerPriceId: z.string().nullable(),
  }),
  subscription: z
    .object({
      id: z.string(),
      userId: z.string(),
      planId: z.string(),
      status: z.string(),
      currentPeriodEnd: dateSchema.nullable(),
      cancelAtPeriodEnd: z.boolean(),
      provider: z.string(),
      providerCustomerId: z.string().nullable(),
      providerSubscriptionId: z.string().nullable(),
      metadata: z.record(z.string(), z.string()),
    })
    .nullable(),
  entitlements: z.array(z.string()),
  quotas: z.object({
    leads: z.number(),
    seats: z.number(),
    storageGb: z.number().optional(),
    workspaces: z.number().optional(),
  }),
});

export type PublicUser = z.infer<typeof publicUserSchema>;

export const singleUserResponseSchema = z.object({
  user: publicUserSchema,
});

export const usersResponseSchema = z.object({
  users: z.array(publicUserSchema),
});

export function mapUser(user: PublicUser): User {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    country: user.country ?? undefined,
    region: user.region ?? undefined,
    locale: user.locale ?? undefined,
    currency: user.currency ?? undefined,
    languages: user.languages ?? [],
    approved: user.approved,
    createdAt: user.createdAt,
    plan: mapPlan(user.plan),
    subscription: user.subscription ? mapSubscription(user.subscription) : null,
    entitlements: user.entitlements,
    quotas: user.quotas,
  };
}

function mapPlan(plan: PublicUser["plan"]): BillingPlan {
  return {
    ...plan,
    description: plan.description ?? undefined,
  };
}

function mapSubscription(subscription: NonNullable<PublicUser["subscription"]>): Subscription {
  return {
    ...subscription,
  };
}

export async function fetchUsers(): Promise<User[]> {
  const res = await apiRequest("GET", USERS_QUERY_KEY[0]);
  const json = await res.json();
  const { users } = usersResponseSchema.parse(json);
  return users.map(mapUser);
}

export async function updateUserApproval(id: string, approved: boolean): Promise<User> {
  const res = await apiRequest("PATCH", `/api/users/${id}/approval`, { approved });
  const json = await res.json();
  const { user } = singleUserResponseSchema.parse(json);
  return mapUser(user);
}
