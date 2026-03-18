import { Link, useLocation } from "wouter";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getGeoPageContent } from "@/content/geoPages";
import { getLocalizedMarketingPath, resolveMarketingLocaleFromPath } from "@/content/locales";
import { StructuredData } from "@/components/StructuredData";
import { buildServicePageStructuredData } from "@/lib/structuredData";

export default function PartnerVerification() {
  const [location] = useLocation();
  const locale = resolveMarketingLocaleFromPath(location);
  const content = getGeoPageContent("partnerVerification", locale?.locale);
  const toMarketingPath = (slug: string) => (locale ? getLocalizedMarketingPath(locale.prefix, slug) : slug);

  return (
    <PublicPageLayout
      title={content.title}
      subtitle={content.summary}
      seo={{ title: content.title, description: content.summary, keywords: content.keywords, canonicalPath: content.slug }}
    >
      <StructuredData id="partner-verification-structured-data" data={buildServicePageStructuredData(content, content.slug)} />
      <section className="grid gap-6 md:grid-cols-2 mb-12">
        {content.faqs.map((faq) => (
          <Card key={faq.question} className="border border-slate-200">
            <CardContent className="pt-6 space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">{faq.question}</h2>
              <p className="text-slate-600">{faq.answer}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-8 mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-3">Supporting resources</h2>
        <ul className="list-disc pl-5 text-slate-700 space-y-2">
          <li>
            <Link className="text-blue-700 underline" href={toMarketingPath("/verification-evidence-checklist")}>
              Verification evidence checklist
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
          <h2 className="text-2xl font-semibold">Increase partner trust before the first handoff</h2>
          <p className="text-slate-200">Standardise checks and keep onboarding outcomes auditable.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" asChild>
            <Link href={toMarketingPath("/pricing")}>View pricing</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Create account</Link>
          </Button>
        </div>
      </section>
    </PublicPageLayout>
  );
}
