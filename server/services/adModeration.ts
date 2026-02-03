import { randomUUID } from "node:crypto";
import type { InsertAdReview } from "@shared/schema";
import type { IStorage } from "../storage";

export const AI_REVIEWER_ID = "ai_system";

export class ModerationBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModerationBlockedError";
  }
}

export async function recordAiReview(
  storage: IStorage,
  input: {
    adId: string;
    status: "pending_review" | "approved" | "rejected";
    result: Record<string, unknown>;
    notes?: string | null;
    reviewerId?: string;
  },
) {
  const review: InsertAdReview = {
    id: `ad_review_${randomUUID()}`,
    adId: input.adId,
    reviewerId: input.reviewerId ?? AI_REVIEWER_ID,
    source: "ai",
    status: input.status,
    notes: input.notes ?? null,
    result: input.result,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return storage.createAdReview(review);
}

export async function assertPublishAllowed(storage: IStorage, adId: string): Promise<void> {
  const reviews = await storage.listAdReviews(adId);
  const approved = reviews.some((review) => review.status === "approved");
  if (!approved) {
    throw new ModerationBlockedError("Ad requires approval before publishing");
  }
}
