import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be defined");
}

// Convert direct Neon connection to pooler connection for better reliability
// This fixes DNS resolution issues in production deployments
if (databaseUrl.includes('.neon.tech') && !databaseUrl.includes('-pooler')) {
  databaseUrl = databaseUrl.replace(
    /(@ep-[^.]+)(\.)/,
    '$1-pooler$2'
  );
  console.log('Using Neon pooler connection for improved reliability');
}

const pool = new Pool({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
});

pool.on("error", (err: Error) => {
  console.error("Unexpected database pool error:", err.message);
});

const db = drizzle(pool, { schema });

export { db, pool };
