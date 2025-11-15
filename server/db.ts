import { neonConfig, neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq } from "drizzle-orm";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be defined");
}

neonConfig.fetchConnectionCache = true;

export const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
export const { leads, leadComments, services, activityLogs } = schema;
export { eq, and };
