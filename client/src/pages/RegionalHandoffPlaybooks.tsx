import { Link, useLocation } from "wouter";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Button } from "@/components/ui/button";
import { getGeoPageContent } from "@/content/geoPages";
import { getLocalizedMarketingPath, resolveMarketingLocaleFromPath } from "@/content/locales";

const playbooks = [
  "Inbound handoff acceptance and SLA confirmation",
  "Customer communication checkpoints",
  "Quality assurance and closure review",
];

export default function RegionalHandoffPlaybooks() {
  const [location] = useLocation();
  const locale = resolveMarketingLocaleFromPath(location);
  const content = getGeoPageContent("regionalHandoffPlaybooks", locale?.locale);
  const toMarketingPath = (slug: string) => (locale ? getLocalizedMarketingPath(locale.prefix, slug) : slug);

  return (
    <PublicPageLayout title={content.title} subtitle={content.summary} seo={{ title: content.title, description: content.summary, keywords: content.keywords, canonicalPath: content.slug }}>
      <ol className="list-decimal pl-6 text-slate-700 space-y-2 mb-10">
        {playbooks.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>

      <p className="text-slate-700 mb-8">
        This subpage supports the <Link className="text-blue-700 underline" href={toMarketingPath("/multi-region-handoff-governance")}>multi-region handoff governance pillar</Link>.
      </p>

      <Button asChild>
        <Link href="/register">Activate governed handoffs</Link>
      </Button>
    </PublicPageLayout>
  );
}
