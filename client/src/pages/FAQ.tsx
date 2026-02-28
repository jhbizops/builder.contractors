import { useLocation } from "wouter";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { KeywordPills } from "@/components/KeywordPills";
import { getGeoPageContent } from "@/content/geoPages";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { resolveMarketingLocaleFromPath } from "@/content/locales";
import { StructuredData } from "@/components/StructuredData";
import { buildFaqPageStructuredData } from "@/lib/structuredData";
import { AISummaryBlock } from "@/components/AISummaryBlock";

export default function FAQ() {
  const [location] = useLocation();
  const marketingLocale = resolveMarketingLocaleFromPath(location);
  const content = getGeoPageContent("faq", marketingLocale?.locale);

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
      <StructuredData id="faq-structured-data" data={buildFaqPageStructuredData(content.faqs)} />
      <AISummaryBlock
        heading="Question intent summary"
        intro="Concise answer intents for AI assistants and search answer cards."
        items={[
          { label: "Verification", value: "Business details are verified during onboarding and monitored." },
          { label: "Access control", value: "Teams control which partners can receive each lead." },
          { label: "Security", value: "Only required project information is shared to complete work." },
          { label: "Coverage", value: "Supports multi-trade, multi-region operations with localisation." },
        ]}
      />
      <section className="bg-white rounded-2xl border border-slate-200 p-8 mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-3">Target keywords</h2>
        <p className="text-slate-600 mb-6">
          These keywords keep our public content aligned with what builders search for when comparing
          partnership platforms.
        </p>
        <KeywordPills keywords={content.keywords} />
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-8">
        <Accordion type="multiple" className="space-y-3">
          {content.faqs.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question} className="border border-slate-200 rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline text-left">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-slate-600">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </PublicPageLayout>
  );
}
