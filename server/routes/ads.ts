import { randomUUID } from "node:crypto";
import { Router, type Response } from "express";
import { z } from "zod";
import {
  adReviewSourceEnum,
  adReviewStatusEnum,
  adStatusEnum,
  type InsertAd,
  type InsertAdReview,
} from "@shared/schema";
import { requireAuth } from "../middleware/auth";
import { storage } from "../storageInstance";
import { assertPublishAllowed, ModerationBlockedError, recordAiReview } from "../services/adModeration";
import { selectDeliverableCreatives } from "../services/adDelivery";

const adsRouter = Router();

const targetingSchema = z.record(z.string(), z.unknown());

const createAdSchema = z.object({
  advertiserId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  targeting: targetingSchema.optional(),
});

const updateStatusSchema = z.object({
  status: adStatusEnum,
});

const reviewSchema = z.object({
  status: adReviewStatusEnum,
  notes: z.string().optional(),
  result: targetingSchema.optional(),
  source: adReviewSourceEnum.default("human"),
});

const deliveryQuerySchema = z.object({
  trade: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    z.string().min(1).optional(),
  ),
  region: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    z.string().min(1).optional(),
  ),
});

const deliveryResponseSchema = z.object({
  creatives: z.array(
    z.object({
      id: z.string(),
      adId: z.string(),
      format: z.string(),
      headline: z.string().nullable(),
      body: z.string().nullable(),
      assetUrl: z.string(),
      callToAction: z.string().nullable(),
      metadata: z.record(z.string(), z.unknown()),
    }),
  ),
});

const insightsResponseSchema = z.object({
  minimumCount: z.number().int().positive(),
  insights: z.array(
    z.object({
      trade: z.string().min(1),
      region: z.string().min(1),
      count: z.number().int().nonnegative(),
    }),
  ),
});

const MIN_K_ANON = 5;

type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
  approved: boolean;
};

function getUser(res: Response): AuthenticatedUser {
  const user = res.locals.authenticatedUser as AuthenticatedUser | undefined;
  if (!user) {
    throw new Error("Authenticated user missing");
  }
  return user;
}

function isAdmin(role: string | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

function requireApproval(user: AuthenticatedUser): boolean {
  return user.approved || isAdmin(user.role);
}

function ensureApproved(user: AuthenticatedUser, res: Response, message: string): boolean {
  if (!requireApproval(user)) {
    res.status(403).json({ message });
    return false;
  }
  return true;
}

adsRouter.use(requireAuth);

adsRouter.get("/delivery", async (req, res, next) => {
  try {
    const user = getUser(res);
    const queryResult = deliveryQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      res.status(400).json({ message: "Invalid request", issues: queryResult.error.issues });
      return;
    }
    const query = queryResult.data;
    const ads = await storage.listAds({ status: "approved" });
    const creatives = await storage.listAdCreatives(ads.map((ad) => ad.id));
    const creativesByAd = creatives.reduce<Record<string, typeof creatives>>((acc, creative) => {
      if (!acc[creative.adId]) {
        acc[creative.adId] = [];
      }
      acc[creative.adId]!.push(creative);
      return acc;
    }, {});

    const eligibleCreatives = selectDeliverableCreatives(
      ads.map((ad) => ({ ad, creatives: creativesByAd[ad.id] ?? [] })),
      {
        role: user.role,
        trade: query.trade ?? null,
        region: query.region ?? null,
      },
    );

    const response = deliveryResponseSchema.safeParse({ creatives: eligibleCreatives });
    if (!response.success) {
      res.status(500).json({ message: "Invalid response schema", issues: response.error.issues });
      return;
    }
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

adsRouter.get("/insights", async (_req, res, next) => {
  try {
    const rows = await storage.listAdInsights();
    const insights = rows
      .filter((row) => row.trade && row.region)
      .map((row) => ({
        trade: row.trade!,
        region: row.region!,
        count: row.count,
      }))
      .filter((row) => row.count >= MIN_K_ANON);

    const response = insightsResponseSchema.parse({
      minimumCount: MIN_K_ANON,
      insights,
    });

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(500).json({ message: "Invalid response schema", issues: error.issues });
      return;
    }
    next(error);
  }
});

adsRouter.post("/", async (req, res, next) => {
  try {
    const user = getUser(res);
    if (!ensureApproved(user, res, "Approval required to create ads")) return;
    const payload = createAdSchema.parse(req.body);
    const admin = isAdmin(user.role);
    if (!admin && payload.advertiserId && payload.advertiserId !== user.id) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const adPayload: InsertAd = {
      id: `ad_${randomUUID()}`,
      advertiserId: admin ? payload.advertiserId ?? user.id : user.id,
      name: payload.name,
      targeting: payload.targeting ?? {},
      status: "draft",
      createdBy: user.email,
      updatedBy: user.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const ad = await storage.createAd(adPayload);
    res.status(201).json({ ad });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

adsRouter.post("/:id/reviews", async (req, res, next) => {
  try {
    const user = getUser(res);
    if (!isAdmin(user.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const payload = reviewSchema.parse(req.body);
    const ad = await storage.getAd(req.params.id);
    if (!ad) {
      res.status(404).json({ message: "Ad not found" });
      return;
    }

    let review;
    if (payload.source === "ai") {
      review = await recordAiReview(storage, {
        adId: ad.id,
        status: payload.status,
        result: payload.result ?? {},
        notes: payload.notes ?? null,
        reviewerId: user.id,
      });
    } else {
      const reviewPayload: InsertAdReview = {
        id: `ad_review_${randomUUID()}`,
        adId: ad.id,
        reviewerId: user.id,
        source: "human",
        status: payload.status,
        notes: payload.notes ?? null,
        result: payload.result ?? {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      review = await storage.createAdReview(reviewPayload);
    }

    if (payload.status === "approved" || payload.status === "rejected") {
      await storage.updateAdStatus(ad.id, payload.status, user.email);
    }

    res.status(201).json({ review });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

adsRouter.patch("/:id/status", async (req, res, next) => {
  try {
    const user = getUser(res);
    if (!ensureApproved(user, res, "Approval required to update ads")) return;
    const payload = updateStatusSchema.parse(req.body);
    const ad = await storage.getAd(req.params.id);
    if (!ad) {
      res.status(404).json({ message: "Ad not found" });
      return;
    }

    const admin = isAdmin(user.role);
    const isAdvertiser = ad.advertiserId === user.id;
    if (!admin && !isAdvertiser) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    if (payload.status === "approved" || payload.status === "rejected") {
      if (!admin) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      if (payload.status === "approved") {
        try {
          await assertPublishAllowed(storage, ad.id);
        } catch (error) {
          if (error instanceof ModerationBlockedError) {
            res.status(409).json({ message: error.message });
            return;
          }
          throw error;
        }
      }
    }

    if (!admin && payload.status !== "draft" && payload.status !== "pending_review") {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const updated = await storage.updateAdStatus(ad.id, payload.status, user.email);
    if (!updated) {
      res.status(404).json({ message: "Ad not found" });
      return;
    }

    res.json({ ad: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid request", issues: error.issues });
      return;
    }
    next(error);
  }
});

export { adsRouter };
