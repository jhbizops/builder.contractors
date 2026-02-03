import { z } from "zod";
import type { Ad, AdCreative } from "@shared/schema";

export type DeliveryContext = {
  role: string;
  trade?: string | null;
  region?: string | null;
};

export type AdWithCreatives = {
  ad: Ad;
  creatives: AdCreative[];
};

type TargetingRules = {
  roles?: string[];
  trades?: string[];
  regions?: string[];
  caps?: {
    daily?: number;
    total?: number;
  };
  delivered?: {
    daily?: number;
    total?: number;
  };
};

const targetingRulesSchema = z
  .object({
    roles: z.array(z.string().min(1)).optional(),
    trades: z.array(z.string().min(1)).optional(),
    regions: z.array(z.string().min(1)).optional(),
    caps: z
      .object({
        daily: z.number().int().nonnegative().optional(),
        total: z.number().int().nonnegative().optional(),
      })
      .optional(),
    delivered: z
      .object({
        daily: z.number().int().nonnegative().optional(),
        total: z.number().int().nonnegative().optional(),
      })
      .optional(),
  })
  .passthrough();

function parseTargeting(targeting: Record<string, unknown>): TargetingRules {
  const parsed = targetingRulesSchema.safeParse(targeting);
  return parsed.success ? parsed.data : {};
}

function withinCaps(targeting: TargetingRules): boolean {
  const caps = targeting.caps;
  if (!caps) return true;
  const delivered = targeting.delivered ?? {};
  if (caps.total !== undefined && delivered.total !== undefined && delivered.total >= caps.total) {
    return false;
  }
  if (caps.daily !== undefined && delivered.daily !== undefined && delivered.daily >= caps.daily) {
    return false;
  }
  return true;
}

function matchesTargeting(ad: Ad, context: DeliveryContext): boolean {
  if (ad.status !== "approved") return false;
  const targeting = parseTargeting(ad.targeting ?? {});
  if (targeting.roles && !targeting.roles.includes(context.role)) {
    return false;
  }
  if (targeting.trades) {
    if (!context.trade || !targeting.trades.includes(context.trade)) {
      return false;
    }
  }
  if (targeting.regions) {
    if (!context.region || !targeting.regions.includes(context.region)) {
      return false;
    }
  }
  return withinCaps(targeting);
}

export function selectDeliverableCreatives(ads: AdWithCreatives[], context: DeliveryContext): AdCreative[] {
  return ads.flatMap(({ ad, creatives }) => {
    if (!matchesTargeting(ad, context)) return [];
    return creatives.filter((creative) => creative.assetUrl);
  });
}
