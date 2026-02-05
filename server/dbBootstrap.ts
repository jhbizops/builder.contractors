import { log } from "./vite";

interface PoolLike {
  query<T = any>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

const requiredTables = [
  "users",
  "jobs",
  "leads",
  "lead_comments",
  "services",
  "custom_pricing",
  "activity_logs",
  "ads",
  "ad_creatives",
  "ad_reviews",
  "exports",
  "billing_plans",
  "subscriptions",
  "user_entitlements",
  "countries",
];

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
  `CREATE TABLE IF NOT EXISTS jobs (
    id text PRIMARY KEY,
    title text NOT NULL,
    description text,
    private_details text,
    status text NOT NULL DEFAULT 'open',
    owner_id text NOT NULL,
    assignee_id text,
    region text,
    country text,
    trade text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
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
    job_id text,
    action text NOT NULL,
    performed_by text NOT NULL,
    timestamp timestamp DEFAULT now(),
    details jsonb NOT NULL DEFAULT '{}'::jsonb
  )`,
  `CREATE TABLE IF NOT EXISTS ads (
    id text PRIMARY KEY,
    advertiser_id text NOT NULL,
    name text NOT NULL,
    targeting jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'draft',
    created_by text NOT NULL,
    updated_by text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS ad_creatives (
    id text PRIMARY KEY,
    ad_id text NOT NULL,
    format text NOT NULL,
    headline text,
    body text,
    asset_url text NOT NULL,
    call_to_action text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS ad_reviews (
    id text PRIMARY KEY,
    ad_id text NOT NULL,
    reviewer_id text NOT NULL,
    source text NOT NULL DEFAULT 'human',
    status text NOT NULL DEFAULT 'pending_review',
    notes text,
    result jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS exports (
    id text PRIMARY KEY,
    status text NOT NULL DEFAULT 'queued',
    filters jsonb NOT NULL DEFAULT '{}'::jsonb,
    file_url text,
    created_by text NOT NULL,
    tenant_id text NOT NULL,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )`,
];

const postBootstrapStatements = [
  `ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS job_id text`,
  `ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '{}'::jsonb`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS trade text`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS private_details text`,
];

async function tableExists(pool: PoolLike, tableName: string): Promise<boolean> {
  const result = await pool.query<{ oid: string | null }>(
    "select to_regclass($1) as oid",
    [`public.${tableName}`],
  );
  return Boolean(result.rows[0]?.oid);
}

async function getMissingTables(pool: PoolLike): Promise<string[]> {
  const missing: string[] = [];
  for (const tableName of requiredTables) {
    const exists = await tableExists(pool, tableName);
    if (!exists) {
      missing.push(tableName);
    }
  }
  return missing;
}

export async function ensureDatabase(pool: PoolLike): Promise<void> {
  try {
    const missingTables = await getMissingTables(pool);

    if (missingTables.length === 0) {
      // All tables exist, just run post-bootstrap alterations
      for (const statement of postBootstrapStatements) {
        await pool.query(statement);
      }
      return;
    }

    // Create all missing tables
    for (const statement of bootstrapStatements) {
      await pool.query(statement);
    }

    // Run post-bootstrap alterations
    for (const statement of postBootstrapStatements) {
      await pool.query(statement);
    }

    log(`database schema bootstrapped (missing tables: ${missingTables.join(", ")})`, "db");
  } catch (error) {
    log(`failed to bootstrap database: ${(error as Error).message}`, "db");
    throw error;
  }
}

export { bootstrapStatements, postBootstrapStatements };
