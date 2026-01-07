import { Router } from "express";
import { requireAdmin } from "../middleware/auth";
import { storage } from "../storageInstance";

const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get("/metrics", async (_req, res, next) => {
  try {
    const [users, leads] = await Promise.all([storage.listUsers(), storage.listLeads()]);
    const pendingApprovals = users.filter((user) => !user.approved).length;
    const activeLeads = leads.filter((lead) => lead.status === "in_progress").length;

    const profiles = await Promise.all(users.map((user) => storage.getUserProfile(user.id)));
    const monthlyRevenueCents = profiles.reduce((total, profile) => {
      if (!profile?.subscription || profile.subscription.status !== "active") {
        return total;
      }

      const plan = profile.plan;
      if (plan.interval === "year") {
        return total + Math.round(plan.priceCents / 12);
      }

      return total + plan.priceCents;
    }, 0);

    res.json({
      metrics: {
        totalUsers: users.length,
        activeLeads,
        pendingApprovals,
        monthlyRevenue: monthlyRevenueCents / 100,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { adminRouter };
