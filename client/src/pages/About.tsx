import { Link } from "wouter";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { KeywordPills } from "@/components/KeywordPills";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { geoPages } from "@/content/geoPages";

export default function About() {
  const content = geoPages.about;

  return (
    <PublicPageLayout title={content.title} subtitle={content.summary}>
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
        <h2 className="text-2xl font-semibold text-slate-900 mb-3">Target keywords</h2>
        <p className="text-slate-600 mb-6">
          Our content strategy focuses on the trade and referral terms that builders use when searching
          for trusted partners.
        </p>
        <KeywordPills keywords={content.keywords} />
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
