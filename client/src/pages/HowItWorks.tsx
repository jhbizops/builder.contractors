import { Link, useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getGeoPageContent } from "@/content/geoPages";
import { resolveMarketingLocaleFromPath } from "@/content/locales";
import { StructuredData } from "@/components/StructuredData";
import { buildServicePageStructuredData } from "@/lib/structuredData";

export default function HowItWorks() {
  const [location] = useLocation();
  const marketingLocale = resolveMarketingLocaleFromPath(location);
  const content = getGeoPageContent("howItWorks", marketingLocale?.locale);

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
      <StructuredData id="how-it-works-service-structured-data" data={buildServicePageStructuredData(content, content.slug)} />
      <section className="bg-white rounded-2xl border border-slate-200 p-8 mb-12 space-y-6">
        <h2 className="text-2xl font-semibold text-slate-900">Service definition</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <article>
            <h3 className="text-lg font-semibold text-slate-900">What is this service?</h3>
            <p className="text-slate-600">A managed workflow that verifies trade partners and routes project opportunities to suitable teams.</p>
          </article>
          <article>
            <h3 className="text-lg font-semibold text-slate-900">What is included?</h3>
            <p className="text-slate-600">Profile verification, scoped lead sharing, role-based collaboration, and referral status tracking.</p>
          </article>
          <article>
            <h3 className="text-lg font-semibold text-slate-900">Where is it available?</h3>
            <p className="text-slate-600">NSW and Australia service operators with optional global expansion support.</p>
          </article>
          <article>
            <h3 className="text-lg font-semibold text-slate-900">What does it cost?</h3>
            <p className="text-slate-600">A free entry tier is available, with paid plans for regional routing and enterprise governance.</p>
          </article>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3 mb-12">
        {content.steps?.map((step, index) => (
          <Card key={step.title} className="border border-slate-200">
            <CardContent className="pt-6 space-y-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                {index + 1}
              </div>
              <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
              <p className="text-slate-600">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2 mb-12">
        {content.faqs.map((faq) => (
          <Card key={faq.question} className="border border-slate-200">
            <CardContent className="pt-6 space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">{faq.question}</h3>
              <p className="text-slate-600">{faq.answer}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold">Start exchanging leads today</h2>
          <p className="text-blue-100">Set up your profile and invite partners in under 10 minutes.</p>
        </div>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/register">
            Get started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>
    </PublicPageLayout>
  );
}
