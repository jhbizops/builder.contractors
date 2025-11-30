import { storage } from "../storageInstance";
import { BillingService } from "./service";

let stripeClient: any = null;
let billingService: BillingService | null = null;

async function initializeStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (stripeSecretKey) {
    try {
      const Stripe = (await import("stripe")).default;
      stripeClient = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });
    } catch (error) {
      console.warn("Stripe initialization failed, billing features will be disabled");
    }
  }
  // Create billingService after Stripe is initialized (or if not available)
  billingService = new BillingService(storage, stripeClient, process.env.STRIPE_WEBHOOK_SECRET);
  return stripeClient;
}

function getBillingService(): BillingService {
  if (!billingService) {
    // Fallback if called before initialization
    billingService = new BillingService(storage, null, process.env.STRIPE_WEBHOOK_SECRET);
  }
  return billingService;
}

export { initializeStripe, getBillingService };
