import { Link, useLocation } from "wouter";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getGeoPageContent } from "@/content/geoPages";
import { getLocalizedMarketingPath, resolveMarketingLocaleFromPath } from "@/content/locales";
import { StructuredData } from "@/components/StructuredData";
import { buildServicePageStructuredData } from "@/lib/structuredData";

const governanceSteps = [
  "Assign ownership for source and destination regions.",
  "Apply policy checks before any customer data transfer.",
  "Track SLA checkpoints through acceptance and completion.",
];

export default function MultiRegionHandoffGovernance() {
  const [location] = useLocation();
  const locale = resolveMarketingLocaleFromPath(location);
  const content = getGeoPageContent("multiRegionHandoffGovernance", locale?.locale);
  const toMarketingPath = (slug: string) => (locale ? getLocalizedMarketingPath(locale.prefix, slug) : slug);

  return (
    <PublicPageLayout
      title={content.title}
      subtitle={content.summary}
      seo={{ title: content.title, description: content.summary, keywords: content.keywords, canonicalPath: content.slug }}
    >
      <StructuredData id="multi-region-handoff-governance-structured-data" data={buildServicePageStructuredData(content, content.slug)} />

      <section className="grid gap-4 mb-12">
        {governanceSteps.map((step, index) => (
          <Card key={step} className="border border-slate-200">
            <CardContent className="pt-6 flex gap-4 items-start">
              <span className="h-8 w-8 shrink-0 rounded-full bg-blue-600 text-white inline-flex items-center justify-center font-semibold">{index + 1}</span>
              <p className="text-slate-700">{step}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-8 mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-3">Supporting resources</h2>
        <ul className="list-disc pl-5 text-slate-700 space-y-2">
          <li>
            <Link className="text-blue-700 underline" href={toMarketingPath("/regional-handoff-playbooks")}>
              Regional handoff playbooks
            </Link>
          </li>
          <li>
            <Link className="text-blue-700 underline" href={toMarketingPath("/lead-exchange-workflow")}>
              Lead exchange workflow pillar
            </Link>
          </li>
        </ul>
      </section>

      <section className="bg-slate-900 text-white rounded-2xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold">Scale operations without losing handoff quality</h2>
          <p className="text-slate-200">Adopt region-specific playbooks with global governance visibility.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" asChild>
            <Link href={toMarketingPath("/pricing")}>See plans</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </section>
    </PublicPageLayout>
  );
}
