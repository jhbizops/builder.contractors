import { Link, useLocation } from "wouter";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Button } from "@/components/ui/button";
import { getGeoPageContent } from "@/content/geoPages";
import { getLocalizedMarketingPath, resolveMarketingLocaleFromPath } from "@/content/locales";

const checklist = [
  "Legal entity and business registration",
  "Licence and insurance validation",
  "Regional service coverage confirmation",
  "Quality, references, and incident checks",
];

export default function VerificationEvidenceChecklist() {
  const [location] = useLocation();
  const locale = resolveMarketingLocaleFromPath(location);
  const content = getGeoPageContent("verificationEvidenceChecklist", locale?.locale);
  const toMarketingPath = (slug: string) => (locale ? getLocalizedMarketingPath(locale.prefix, slug) : slug);

  return (
    <PublicPageLayout title={content.title} subtitle={content.summary} seo={{ title: content.title, description: content.summary, keywords: content.keywords, canonicalPath: content.slug }}>
      <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-10">
        {checklist.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <p className="text-slate-700 mb-8">
        Return to the <Link className="text-blue-700 underline" href={toMarketingPath("/partner-verification")}>partner verification pillar</Link> to align this checklist with your onboarding workflow.
      </p>

      <Button asChild>
        <Link href={toMarketingPath("/pricing")}>Compare plan options</Link>
      </Button>
    </PublicPageLayout>
  );
}
