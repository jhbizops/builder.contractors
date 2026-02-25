import { Link, useLocation } from "wouter";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getGeoPageContent } from "@/content/geoPages";
import { resolveMarketingLocaleFromPath } from "@/content/locales";
import { StructuredData } from "@/components/StructuredData";
import { buildServicePageStructuredData } from "@/lib/structuredData";

export default function About() {
  const [location] = useLocation();
  const marketingLocale = resolveMarketingLocaleFromPath(location);
  const content = getGeoPageContent("about", marketingLocale?.locale);

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
      <StructuredData id="about-service-structured-data" data={buildServicePageStructuredData(content, content.slug)} />
      <section className="bg-white rounded-2xl border border-slate-200 p-8 mb-12 space-y-6">
        <h2 className="text-2xl font-semibold text-slate-900">Direct answer</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <article>
            <h3 className="text-lg font-semibold text-slate-900">What is this service?</h3>
            <p className="text-slate-600">A verified partner network that lets builders and contractors exchange leads with compliance guardrails.</p>
          </article>
          <article>
            <h3 className="text-lg font-semibold text-slate-900">Who is it for?</h3>
            <p className="text-slate-600">Licensed builders, specialist contractors, and operations teams that need controlled referral handoffs.</p>
          </article>
          <article>
            <h3 className="text-lg font-semibold text-slate-900">Where is it available?</h3>
            <p className="text-slate-600">Primary coverage in NSW and Australia, with global partner routing support.</p>
          </article>
          <article>
            <h3 className="text-lg font-semibold text-slate-900">What makes this provider different?</h3>
            <p className="text-slate-600">Identity verification, private-by-default collaboration, and strong workflow controls for multi-region delivery.</p>
          </article>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3 mb-12">
        {content.highlights?.map((highlight) => (
          <Card key={highlight.title} className="border border-slate-200">
            <CardContent className="pt-6 space-y-2">
              <h3 className="text-xl font-semibold text-slate-900">{highlight.title}</h3>
              <p className="text-slate-600">{highlight.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-8 mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Trust and credentials</h2>
        <ul className="list-disc pl-6 text-slate-600 space-y-2">
          <li>Entity: Builder.Contractors (Elyment ecosystem product).</li>
          <li>Operations: security-first, controlled data sharing, role-based access controls.</li>
          <li>Experience signal: designed for established trade teams and project delivery managers.</li>
          <li>Support channel: managed onboarding and policy-led partner verification.</li>
        </ul>
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

      <section className="bg-slate-900 text-white rounded-2xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold">Ready to grow your referral network?</h2>
          <p className="text-slate-200">Join Builder.Contractors and start exchanging verified leads today.</p>
        </div>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/register">Create your account</Link>
        </Button>
      </section>
    </PublicPageLayout>
  );
}
