import Stripe from "stripe";
import { z } from "zod";
import { defaultBillingPlans } from "@shared/billingPlans";
import { type BillingPlan, type Subscription, insertBillingPlanSchema } from "@shared/schema";
import { type DatabaseStorage, type UserProfile } from "../storage";
import { log } from "../vite";

const checkoutSchema = z.object({
  planId: z.enum(["free", "pro", "enterprise"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export type BillingContext = UserProfile;

export class BillingService {
  constructor(
    private readonly db: DatabaseStorage,
    private readonly stripeClient: Stripe | null,
    private readonly webhookSecret: string | undefined = process.env.STRIPE_WEBHOOK_SECRET,
  ) {}

  async ensurePlans(): Promise<BillingPlan[]> {
    const priceOverride = {
      pro: process.env.STRIPE_PRICE_PRO ?? null,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? null,
    };

    const plans = defaultBillingPlans.map((plan) => ({
      ...plan,
      providerPriceId: priceOverride[plan.id as keyof typeof priceOverride] ?? plan.providerPriceId,
    }));

    const parsedPlans = plans.map((plan) => insertBillingPlanSchema.parse(plan));
    return this.db.upsertBillingPlans(parsedPlans);
  }

  async listPlans(): Promise<BillingPlan[]> {
    return this.db.listPlans();
  }

  async getUserBilling(userId: string): Promise<BillingContext | null> {
    const profile = await this.db.getUserProfile(userId);

    if (!profile) {
      return null;
    }

    let hydratedProfile = profile;
    let hasEntitlementsRecord = profile.hasEntitlementsRecord ?? false;

    if (!profile.subscription) {
      await this.db.upsertSubscription({
        id: `sub_${profile.user.id}`,
        userId: profile.user.id,
        planId: profile.plan.id,
        status: "active",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        provider: "stripe",
        providerCustomerId: null,
        providerSubscriptionId: null,
        metadata: {},
      });

      hydratedProfile = (await this.db.getUserProfile(userId)) ?? profile;
      hasEntitlementsRecord = hydratedProfile.hasEntitlementsRecord ?? hasEntitlementsRecord;
    }

    if (!hasEntitlementsRecord) {
      await this.db.upsertUserEntitlements({
        userId: hydratedProfile.user.id,
        features: hydratedProfile.entitlements,
        quotas: hydratedProfile.quotas,
      });
    }

    return hydratedProfile;
  }

  async createCheckoutSession(userId: string, input: unknown): Promise<{ url: string }> {
    const payload = checkoutSchema.parse(input);

    if (!this.stripeClient) {
      throw new Error("Stripe is not configured");
    }

    const plan = await this.db.getPlan(payload.planId);
    const user = await this.db.getUser(userId);

    if (!plan || !user) {
      throw new Error("Plan not found");
    }

    if (!plan.providerPriceId) {
      throw new Error(`Missing provider price for ${plan.id}`);
    }

    const session = await this.stripeClient.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      success_url: payload.successUrl,
      cancel_url: payload.cancelUrl,
      line_items: [
        {
          price: plan.providerPriceId,
          quantity: 1,
        },
      ],
      metadata: { planId: plan.id, userId },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout url");
    }

    return { url: session.url };
  }

  async cancelSubscription(userId: string): Promise<Subscription | null> {
    const subscription = await this.db.getSubscriptionForUser(userId);

    if (!subscription) {
      return null;
    }

    if (this.stripeClient && subscription.providerSubscriptionId) {
      await this.stripeClient.subscriptions.update(subscription.providerSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    return this.db.setSubscriptionCancellation(userId, true);
  }

  async handleWebhook(payload: Buffer, signature: string | string[] | undefined): Promise<void> {
    if (!this.stripeClient) {
      log("Webhook attempted without Stripe configured", "billing");
      return;
    }

    if (!this.webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET must be set for webhook verification");
    }

    const event = this.stripeClient.webhooks.constructEvent(payload, signature ?? "", this.webhookSecret);

    switch (event.type) {
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await this.db.setSubscriptionStatus(
          subscription.id,
          subscription.status,
          (subscription.items.data[0]?.price?.metadata?.planId as string | undefined) ?? undefined,
          subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
        );
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const planId = session.metadata?.planId;
        const userId = session.metadata?.userId;

        if (planId && userId) {
          await this.db.upsertSubscription({
            id: session.id,
            userId,
            planId,
            status: "active",
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            provider: "stripe",
            providerCustomerId: session.customer as string | null,
            providerSubscriptionId: session.subscription as string | null,
            metadata: {},
          });
        }
        break;
      }
      default:
        log(`Unhandled webhook event: ${event.type}`, "billing");
    }
  }
}
