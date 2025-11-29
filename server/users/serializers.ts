import type { BillingPlan, PlanQuota, Subscription, User } from "@shared/schema";
import type { UserProfile } from "../storage";

export interface PublicUser
  extends Omit<User, "passwordHash" | "passwordSalt"> {
  plan: BillingPlan;
  subscription: Subscription | null;
  entitlements: string[];
  quotas: PlanQuota;
}

export function toPublicUser(profile: UserProfile): PublicUser {
  const { user, plan, subscription, entitlements, quotas } = profile;
  const { passwordHash, passwordSalt, ...rest } = user;

  return {
    ...rest,
    plan,
    subscription,
    entitlements,
    quotas,
  };
}
