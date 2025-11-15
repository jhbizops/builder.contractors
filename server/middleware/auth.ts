import type { RequestHandler } from "express";
import { storage } from "../storage";

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    const user = await storage.getUser(userId);

    if (!user) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    res.locals.authenticatedUser = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin: RequestHandler = async (req, res, next) => {
  await requireAuth(req, res, (error) => {
    if (error) {
      next(error);
      return;
    }

    const user = res.locals.authenticatedUser;

    if (user?.role !== "admin") {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    next();
  });
};
