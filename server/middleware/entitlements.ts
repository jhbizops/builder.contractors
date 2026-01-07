import type { RequestHandler } from "express";
import { storage } from "../storageInstance";

type AuthenticatedUser = {
  id: string;
  role?: string | null;
};

const isAdmin = (role: string | null | undefined): boolean => role === "admin" || role === "super_admin";

type EntitlementOptions = {
  deniedMessage?: string;
  missingMessage?: string;
};

export const requireEntitlement = (entitlement: string, options: EntitlementOptions = {}): RequestHandler => {
  return async (_req, res, next) => {
    try {
      const user = res.locals.authenticatedUser as AuthenticatedUser | undefined;

      if (!user) {
        res.status(401).json({ message: "Unauthenticated" });
        return;
      }

      if (isAdmin(user.role)) {
        next();
        return;
      }

      const profile = await storage.getUserProfile(user.id);
      if (!profile) {
        res.status(403).json({ message: options.missingMessage ?? "Entitlements not available" });
        return;
      }

      if (!profile.entitlements.includes(entitlement)) {
        res.status(403).json({ message: options.deniedMessage ?? "Forbidden" });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
