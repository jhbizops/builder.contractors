import { Link } from "wouter";
import { CheckCircle2 } from "lucide-react";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { KeywordPills } from "@/components/KeywordPills";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { geoPages } from "@/content/geoPages";

export default function Pricing() {
  const content = geoPages.pricing;

  return (
    <PublicPageLayout title={content.title} subtitle={content.summary}>
      <section className="grid gap-6 lg:grid-cols-3 mb-12">
        {content.tiers?.map((tier) => (
          <Card key={tier.name} className="border border-slate-200">
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500">{tier.name}</p>
                <h3 className="text-3xl font-semibold text-slate-900 mt-2">{tier.priceLabel}</h3>
                <p className="text-slate-600 mt-2">{tier.description}</p>
              </div>
              <ul className="space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start text-slate-600">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full" variant={tier.name === "Growth" ? "default" : "outline"}>
                <Link href="/register">Choose {tier.name}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-8 mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-3">Target keywords</h2>
        <p className="text-slate-600 mb-6">
          Pricing pages should reinforce the same search intent as our geo-targeted marketing content.
        </p>
        <KeywordPills keywords={content.keywords} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {content.faqs.map((faq) => (
          <Card key={faq.question} className="border border-slate-200">
            <CardContent className="pt-6 space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">{faq.question}</h3>
              <p className="text-slate-600">{faq.answer}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </PublicPageLayout>
  );
}
