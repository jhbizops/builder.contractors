import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { KeywordPills } from "@/components/KeywordPills";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { geoPages } from "@/content/geoPages";

export default function HowItWorks() {
  const content = geoPages.howItWorks;

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

      <section className="bg-white rounded-2xl border border-slate-200 p-8 mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-3">Target keywords</h2>
        <p className="text-slate-600 mb-6">
          Use these search-focused phrases consistently across marketing pages for stronger organic reach.
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
