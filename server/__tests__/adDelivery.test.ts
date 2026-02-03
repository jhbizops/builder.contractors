import { describe, expect, it } from "vitest";
import type { Ad, AdCreative } from "@shared/schema";
import { selectDeliverableCreatives } from "../services/adDelivery";

const baseAd: Ad = {
  id: "ad_1",
  advertiserId: "user_1",
  name: "Test Ad",
  targeting: {},
  status: "approved",
  createdBy: "test@example.com",
  updatedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseCreative: AdCreative = {
  id: "creative_1",
  adId: "ad_1",
  format: "banner",
  headline: "Headline",
  body: "Body",
  assetUrl: "https://example.com/banner.png",
  callToAction: "Learn more",
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("selectDeliverableCreatives", () => {
  it("filters by status, targeting, and caps", () => {
    const ads = [
      {
        ad: {
          ...baseAd,
          id: "ad_eligible",
          targeting: {
            roles: ["builder"],
            trades: ["plumbing"],
            regions: ["nsw"],
          },
        },
        creatives: [{ ...baseCreative, id: "creative_eligible", adId: "ad_eligible" }],
      },
      {
        ad: {
          ...baseAd,
          id: "ad_wrong_role",
          targeting: { roles: ["admin"] },
        },
        creatives: [{ ...baseCreative, id: "creative_wrong_role", adId: "ad_wrong_role" }],
      },
      {
        ad: {
          ...baseAd,
          id: "ad_capped",
          targeting: { caps: { total: 3 }, delivered: { total: 3 } },
        },
        creatives: [{ ...baseCreative, id: "creative_capped", adId: "ad_capped" }],
      },
      {
        ad: {
          ...baseAd,
          id: "ad_unapproved",
          status: "pending_review",
        },
        creatives: [{ ...baseCreative, id: "creative_unapproved", adId: "ad_unapproved" }],
      },
    ];

    const creatives = selectDeliverableCreatives(ads, {
      role: "builder",
      trade: "plumbing",
      region: "nsw",
    });

    expect(creatives).toHaveLength(1);
    expect(creatives[0]?.id).toBe("creative_eligible");
  });

  it("skips trade-targeted ads when trade is missing", () => {
    const ads = [
      {
        ad: {
          ...baseAd,
          id: "ad_trade_only",
          targeting: { trades: ["roofing"] },
        },
        creatives: [{ ...baseCreative, id: "creative_trade_only", adId: "ad_trade_only" }],
      },
    ];

    const creatives = selectDeliverableCreatives(ads, {
      role: "builder",
      trade: null,
      region: "nsw",
    });

    expect(creatives).toHaveLength(0);
  });
});
