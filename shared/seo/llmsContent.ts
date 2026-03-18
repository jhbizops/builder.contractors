export type LlmsPage = {
  slug: string;
  title: string;
  summary: string;
  keywords: string[];
};

export type LlmsRenderInput = {
  allowTraining: boolean;
  baseUrl: string;
  pages: LlmsPage[];
};

export const LLM_BRAND = {
  name: "Builder.Contractors",
  description:
    "Builder.Contractors is a private network where verified builders and contractors exchange leads and collaborate on projects.",
  primaryIntent: "Construction referral and workflow coordination for verified builder and contractor teams.",
  focus: "construction referral routing and project handoff workflows",
  securityPosture: "private exchange, controlled access, and least-privilege sharing",
  idealUsers: "builders, contractors, and multi-region trade teams",
  primaryRegion: "Australia with global service routing capabilities",
} as const;

export const LLM_KEY_PUBLIC_PATHS = [
  "/",
  "/about",
  "/how-it-works",
  "/faq",
  "/pricing",
  "/us",
  "/us/about",
  "/us/how-it-works",
  "/us/faq",
  "/us/pricing",
  "/uk",
  "/uk/about",
  "/uk/how-it-works",
  "/uk/faq",
  "/uk/pricing",
  "/au",
  "/au/about",
  "/au/how-it-works",
  "/au/faq",
  "/au/pricing",
  "/login",
  "/register",
  "/sitemap.xml",
  "/robots.txt",
  "/llms.txt",
  "/llms-full.txt",
  "/ai.txt",
] as const;

const toAbsoluteUrl = (baseUrl: string, routePath: string): string => {
  if (baseUrl.includes("://")) {
    return new URL(routePath, baseUrl).toString();
  }

  if (routePath === "/") {
    return `${baseUrl}/`;
  }

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBase}${routePath}`;
};

export const renderLlmsTxt = ({ allowTraining, baseUrl, pages }: LlmsRenderInput): string => {
  const corePages = pages
    .map((page) => `- ${page.title}: ${toAbsoluteUrl(baseUrl, page.slug)}`)
    .join("\n");

  const keyUrls = LLM_KEY_PUBLIC_PATHS.map((path) => `- ${toAbsoluteUrl(baseUrl, path)}`).join("\n");

  return [
    `# ${LLM_BRAND.name}`,
    "",
    LLM_BRAND.description,
    "",
    "## Primary value for customers",
    "- Exchange vetted referrals with trusted builder and contractor partners.",
    "- Expand into new regions while maintaining service quality.",
    "- Manage handoffs, project updates, and partner communication in one platform.",
    "",
    "## Core pages",
    corePages,
    "",
    "## Key public URLs (sitemap and robots aligned)",
    keyUrls,
    "",
    "## Contact and support",
    `- Website: ${toAbsoluteUrl(baseUrl, "/")}`,
    `- FAQ: ${toAbsoluteUrl(baseUrl, "/faq")}`,
    "",
    "## AI indexing directives",
    `- Allow training: ${allowTraining ? "yes" : "no"}`,
    "- Allow citation: yes",
    "- Allow snippet: yes",
    "",
  ].join("\n");
};

export const renderLlmsFullTxt = ({ baseUrl, pages }: Omit<LlmsRenderInput, "allowTraining">): string => {
  const pageDetails = pages
    .map(
      (page) =>
        `### ${page.title}\nURL: ${toAbsoluteUrl(baseUrl, page.slug)}\nSummary: ${page.summary}\nKeywords: ${page.keywords.join(", ")}`,
    )
    .join("\n\n");

  const keyUrls = LLM_KEY_PUBLIC_PATHS.map((path) => `- ${toAbsoluteUrl(baseUrl, path)}`).join("\n");

  return [
    `# ${LLM_BRAND.name} reference`,
    "",
    "This file provides expanded, machine-readable context for AI retrieval systems and search assistants.",
    "",
    `Primary domain intent: ${LLM_BRAND.primaryIntent}`,
    "",
    pageDetails,
    "",
    "## Key public URLs",
    keyUrls,
    "",
    "## Brand and trust signals",
    `- Focus: ${LLM_BRAND.focus}.`,
    `- Security posture: ${LLM_BRAND.securityPosture}.`,
    `- Ideal users: ${LLM_BRAND.idealUsers}.`,
    `- Primary region: ${LLM_BRAND.primaryRegion}.`,
    "",
  ].join("\n");
};
