import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be defined");
}

const pool = new Pool({ connectionString: databaseUrl });

const db = drizzle(pool, { schema });

export { db, pool };
