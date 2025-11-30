import { log } from "./vite";

interface PoolLike {
  query<T = any>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

const bootstrapStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY,
    email text NOT NULL UNIQUE,
    role text NOT NULL,
    country text,
    region text,
    locale text,
    currency text,
    languages jsonb NOT NULL DEFAULT '[]'::jsonb,
    approved boolean DEFAULT false,
    password_hash text NOT NULL,
    password_salt text NOT NULL,
    created_at timestamp DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS billing_plans (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    interval text NOT NULL DEFAULT 'month',
    price_cents integer NOT NULL,
    currency text NOT NULL DEFAULT 'usd',
    entitlements jsonb NOT NULL DEFAULT '[]'::jsonb,
    quotas jsonb NOT NULL,
    is_default boolean NOT NULL DEFAULT false,
    provider_price_id text
  )`,
  `CREATE TABLE IF NOT EXISTS subscriptions (
    id text PRIMARY KEY,
    user_id text NOT NULL,
    plan_id text NOT NULL,
    status text NOT NULL DEFAULT 'active',
    current_period_end timestamp,
    cancel_at_period_end boolean DEFAULT false,
    provider text NOT NULL DEFAULT 'stripe',
    provider_customer_id text,
    provider_subscription_id text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb
  )`,
  `CREATE TABLE IF NOT EXISTS user_entitlements (
    user_id text PRIMARY KEY,
    features jsonb NOT NULL DEFAULT '[]'::jsonb,
    quotas jsonb NOT NULL,
    updated_at timestamp DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS countries (
    code text PRIMARY KEY,
    name text NOT NULL,
    langs jsonb NOT NULL,
    currency text NOT NULL,
    localize boolean NOT NULL DEFAULT false,
    proficiency text NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS leads (
    id text PRIMARY KEY,
    partner_id text NOT NULL,
    client_name text NOT NULL,
    status text NOT NULL DEFAULT 'new',
    location text,
    country text,
    region text,
    notes jsonb DEFAULT '[]'::jsonb,
    files jsonb DEFAULT '[]'::jsonb,
    created_by text NOT NULL,
    updated_by text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS lead_comments (
    id text PRIMARY KEY,
    lead_id text NOT NULL,
    body text NOT NULL,
    author text NOT NULL,
    timestamp timestamp DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS services (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    unit text NOT NULL,
    base_price integer NOT NULL,
    image_url text,
    active boolean DEFAULT true
  )`,
  `CREATE TABLE IF NOT EXISTS custom_pricing (
    id text PRIMARY KEY,
    user_id text NOT NULL,
    service_id text NOT NULL,
    price integer NOT NULL,
    notes text
  )`,
  `CREATE TABLE IF NOT EXISTS activity_logs (
    id text PRIMARY KEY,
    lead_id text,
    action text NOT NULL,
    performed_by text NOT NULL,
    timestamp timestamp DEFAULT now()
  )`,
];

async function tableExists(pool: PoolLike, tableName: string): Promise<boolean> {
  const result = await pool.query<{ oid: string | null }>(
    "select to_regclass($1) as oid",
    [`public.${tableName}`],
  );
  return Boolean(result.rows[0]?.oid);
}

export async function ensureDatabase(pool: PoolLike): Promise<void> {
  try {
    const hasUsersTable = await tableExists(pool, "users");

    if (hasUsersTable) {
      return;
    }

    for (const statement of bootstrapStatements) {
      await pool.query(statement);
    }

    log("database schema bootstrapped", "db");
  } catch (error) {
    log(`failed to bootstrap database: ${(error as Error).message}`, "db");
    throw error;
  }
}

export { bootstrapStatements };
