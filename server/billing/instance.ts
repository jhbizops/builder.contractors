import Stripe from "stripe";
import { storage } from "../storageInstance";
import { BillingService } from "./service";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeClient = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" }) : null;

export const billingService = new BillingService(storage, stripeClient, process.env.STRIPE_WEBHOOK_SECRET);
