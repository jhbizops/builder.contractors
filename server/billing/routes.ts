import express, { Router } from "express";
import { z } from "zod";
import { getBillingService } from "./instance";
import { requireAuth } from "../middleware/auth";

const billingRouter = Router();

const cancelSchema = z.object({});
const webhookMiddleware = express.raw({ type: "application/json" });

billingRouter.get("/plans", async (_req, res, next) => {
  try {
    const billingService = getBillingService();
    const plans = await billingService.listPlans();
    res.json({ plans });
  } catch (error) {
    next(error);
  }
});

billingRouter.get("/subscription", requireAuth, async (_req, res, next) => {
  try {
    const user = res.locals.authenticatedUser;
    if (!user) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const billingService = getBillingService();
    const billing = await billingService.getUserBilling(user.id);

    if (!billing) {
      res.status(404).json({ message: "Unable to resolve billing profile" });
      return;
    }

    res.json({
      subscription: billing.subscription,
      plan: billing.plan,
      entitlements: billing.entitlements,
      quotas: billing.quotas,
    });
  } catch (error) {
    next(error);
  }
});

billingRouter.post("/checkout", requireAuth, async (req, res, next) => {
  try {
    const user = res.locals.authenticatedUser;
    if (!user) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const billingService = getBillingService();
    const session = await billingService.createCheckoutSession(user.id, req.body);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

billingRouter.post("/cancel", requireAuth, async (req, res, next) => {
  try {
    cancelSchema.parse(req.body ?? {});
    const user = res.locals.authenticatedUser;
    if (!user) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const billingService = getBillingService();
    const subscription = await billingService.cancelSubscription(user.id);
    res.json({ subscription });
  } catch (error) {
    next(error);
  }
});

billingRouter.post("/webhook", webhookMiddleware, async (req, res) => {
  try {
    const signature = req.header("stripe-signature");
    const billingService = getBillingService();
    await billingService.handleWebhook(req.body as Buffer, signature ?? undefined);
    res.status(200).json({ received: true });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

export { billingRouter };
