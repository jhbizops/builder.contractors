BEGIN;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE custom_pricing ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE ad_creatives ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE ad_reviews ADD COLUMN IF NOT EXISTS tenant_id text;

UPDATE jobs SET tenant_id = owner_id WHERE tenant_id IS NULL;
UPDATE leads SET tenant_id = partner_id WHERE tenant_id IS NULL;
UPDATE ads SET tenant_id = advertiser_id WHERE tenant_id IS NULL;
UPDATE ad_creatives c
SET tenant_id = a.tenant_id
FROM ads a
WHERE c.tenant_id IS NULL AND c.ad_id = a.id;
UPDATE ad_reviews r
SET tenant_id = a.tenant_id
FROM ads a
WHERE r.tenant_id IS NULL AND r.ad_id = a.id;

UPDATE custom_pricing cp
SET tenant_id = cp.user_id
WHERE cp.tenant_id IS NULL;

UPDATE services s
SET tenant_id = cp.tenant_id
FROM custom_pricing cp
WHERE s.tenant_id IS NULL AND cp.service_id = s.id;

UPDATE services
SET tenant_id = 'global'
WHERE tenant_id IS NULL;

ALTER TABLE jobs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE leads ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE services ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE custom_pricing ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE ads ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE ad_creatives ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE ad_reviews ALTER COLUMN tenant_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_tenant_id ON jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_custom_pricing_tenant_id ON custom_pricing(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ads_tenant_id ON ads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_tenant_id ON ad_creatives(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ad_reviews_tenant_id ON ad_reviews(tenant_id);

COMMIT;
