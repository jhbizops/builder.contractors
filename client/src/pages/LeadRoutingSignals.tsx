import { Link, useLocation } from "wouter";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getGeoPageContent } from "@/content/geoPages";
import { getLocalizedMarketingPath, resolveMarketingLocaleFromPath } from "@/content/locales";

const signals = ["Trade specialization", "Region and distance", "Current capacity", "Compliance status"];

export default function LeadRoutingSignals() {
  const [location] = useLocation();
  const locale = resolveMarketingLocaleFromPath(location);
  const content = getGeoPageContent("leadRoutingSignals", locale?.locale);
  const toMarketingPath = (slug: string) => (locale ? getLocalizedMarketingPath(locale.prefix, slug) : slug);

  return (
    <PublicPageLayout title={content.title} subtitle={content.summary} seo={{ title: content.title, description: content.summary, keywords: content.keywords, canonicalPath: content.slug }}>
      <section className="grid gap-4 md:grid-cols-2 mb-10">
        {signals.map((signal) => (
          <Card key={signal} className="border border-slate-200">
            <CardContent className="pt-6 text-slate-700">{signal}</CardContent>
          </Card>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-8 mb-10">
        <p className="text-slate-700">
          This guidance supports the pillar page on{" "}
          <Link href={toMarketingPath("/lead-exchange-workflow")} className="text-blue-700 underline">lead exchange workflow</Link>.
        </p>
      </section>

      <Button asChild>
        <Link href="/register">Start routing better leads</Link>
      </Button>
    </PublicPageLayout>
  );
}
