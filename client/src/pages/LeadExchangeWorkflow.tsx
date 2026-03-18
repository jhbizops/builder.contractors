import { Link, useLocation } from "wouter";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getGeoPageContent } from "@/content/geoPages";
import { getLocalizedMarketingPath, resolveMarketingLocaleFromPath } from "@/content/locales";
import { StructuredData } from "@/components/StructuredData";
import { buildServicePageStructuredData } from "@/lib/structuredData";

export default function LeadExchangeWorkflow() {
  const [location] = useLocation();
  const locale = resolveMarketingLocaleFromPath(location);
  const content = getGeoPageContent("leadExchangeWorkflow", locale?.locale);
  const toMarketingPath = (slug: string) => (locale ? getLocalizedMarketingPath(locale.prefix, slug) : slug);

  return (
    <PublicPageLayout
      title={content.title}
      subtitle={content.summary}
      seo={{
        title: content.title,
        description: content.summary,
        keywords: content.keywords,
        canonicalPath: content.slug,
      }}
    >
      <StructuredData id="lead-exchange-workflow-structured-data" data={buildServicePageStructuredData(content, content.slug)} />

      <section className="grid gap-4 md:grid-cols-3 mb-12">
        {["Intake and scoring", "Partner fit checks", "Outcome feedback loop"].map((item) => (
          <Card key={item} className="border border-slate-200">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-slate-900">{item}</h2>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-8 mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-3">Supporting resources</h2>
        <ul className="list-disc pl-5 text-slate-700 space-y-2">
          <li>
            <Link className="text-blue-700 underline" href={toMarketingPath("/lead-routing-signals")}>Lead routing signals and matching rules</Link>
          </li>
          <li>
            <Link className="text-blue-700 underline" href={toMarketingPath("/partner-verification")}>Partner verification framework</Link>
          </li>
        </ul>
      </section>

      <section className="bg-slate-900 text-white rounded-2xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold">Move from ad-hoc referrals to governed workflows</h2>
          <p className="text-slate-200">Start with a secure profile, then configure your lead routing in minutes.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" asChild>
            <Link href={toMarketingPath("/pricing")}>View pricing</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </section>
    </PublicPageLayout>
  );
}
