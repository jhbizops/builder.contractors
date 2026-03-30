export type GeoPageFaq = {
  question: string;
  answer: string;
};

type Highlight = {
  title: string;
  description: string;
};

type Step = {
  title: string;
  description: string;
};

type PricingTier = {
  name: string;
  priceLabel: string;
  description: string;
  features: string[];
};

export type GeoPageContent = {
  slug: string;
  title: string;
  summary: string;
  keywords: string[];
  faqs: GeoPageFaq[];
  highlights?: Highlight[];
  steps?: Step[];
  tiers?: PricingTier[];
};

export const geoPages: Record<
  | "home"
  | "about"
  | "howItWorks"
  | "faq"
  | "pricing"
  | "leadExchangeWorkflow"
  | "partnerVerification"
  | "multiRegionHandoffGovernance"
  | "leadRoutingSignals"
  | "verificationEvidenceChecklist"
  | "regionalHandoffPlaybooks",
  GeoPageContent
> = {
  home: {
    slug: "/",
    title: "Builder.Contractors - Exchange Leads, Grow Together",
    summary:
      "Join the global network of builders and contractors sharing projects, exchanging work opportunities, and supporting each other's growth.",
    keywords: [
      "builder network",
      "contractor leads",
      "construction leads exchange",
      "global contractors",
      "construction network",
      "trade partners",
    ],
    faqs: [],
  },
  about: {
    slug: "/about",
    title: "About Builder.Contractors",
    summary:
      "Builder.Contractors is a private construction referral and workflow coordination network for verified builders and contractors.",
    keywords: [
      "builder referral network",
      "contractor lead exchange",
      "trade partner marketplace",
      "multi-region builder network",
    ],
    highlights: [
      {
        title: "Built for verified trade teams",
        description: "Every profile represents a real company, so referrals stay professional and accountable.",
      },
      {
        title: "Designed for cross-region growth",
        description: "Share work with trusted partners when projects fall outside your service area.",
      },
      {
        title: "Security-first by default",
        description: "We protect customer information while helping you collaborate safely with peers.",
      },
    ],
    faqs: [
      {
        question: "Who can join Builder.Contractors?",
        answer: "Licensed builders, contractors, and verified trade businesses that want to exchange vetted leads and partnerships.",
      },
      {
        question: "Is this a public directory?",
        answer: "No. Profiles are private by default, and invitations are designed to keep work referrals controlled and trustworthy.",
      },
    ],
  },
  howItWorks: {
    slug: "/how-it-works",
    title: "How Builder.Contractors Works",
    summary:
      "Stop losing quote requests in email threads. Keep scope, pricing, and subcontractor communication documented in one shared workflow.",
    keywords: [
      "how builder referrals work",
      "trade collaboration workflow",
      "contractor lead handoff",
      "verified builder matching",
    ],
    steps: [
      {
        title: "Create a trusted profile",
        description: "Highlight your service areas, specialties, and credentials so partners know when to loop you in.",
      },
      {
        title: "Share or receive leads",
        description:
          "Send quote requests to subcontractors with clear scope, location, and trade requirements so every response stays linked to the job.",
      },
      {
        title: "Coordinate delivery",
        description:
          "Track handoffs, approvals, and updates inside the platform so builders and subcontractors can contract with confidence.",
      },
    ],
    faqs: [
      {
        question: "How fast can we get started?",
        answer: "Most teams can publish their profile and begin exchanging leads the same day.",
      },
      {
        question: "Do you support multi-region teams?",
        answer: "Yes. You can manage teams, territories, and partners across multiple regions in one account.",
      },
    ],
  },
  faq: {
    slug: "/faq",
    title: "Builder.Contractors FAQ",
    summary: "Answers to the most common questions about partnering, security, and lead exchange.",
    keywords: [
      "builder contractor faq",
      "lead exchange security",
      "partner verification",
      "trade referrals",
    ],
    faqs: [
      {
        question: "How do you verify builders and contractors?",
        answer: "We confirm business details during onboarding and maintain ongoing checks for compliance and reputation.",
      },
      {
        question: "Can I control who receives my leads?",
        answer: "Yes. You decide which partners receive projects, and you can revoke access at any time.",
      },
      {
        question: "Is customer data protected?",
        answer: "We share only the information required to deliver the project and keep sensitive details secure.",
      },
      {
        question: "Do you support multiple trades?",
        answer: "Absolutely. Teams can list multiple specialties and build curated partner lists per trade.",
      },
      {
        question: "What regions do you support?",
        answer: "Builder.Contractors supports global teams with configurable regions and localised workflows.",
      },
      {
        question: "How do I invite a partner?",
        answer: "Invite verified partners directly from your dashboard and start collaborating immediately.",
      },
    ],
  },
  pricing: {
    slug: "/pricing",
    title: "Pricing for Builder.Contractors",
    summary: "Transparent plans for construction referral routing, partner collaboration, and multi-region workflow coordination.",
    keywords: [
      "builder contractor pricing",
      "lead exchange plans",
      "trade collaboration platform cost",
      "builder network subscription",
    ],
    tiers: [
      {
        name: "Starter",
        priceLabel: "Free",
        description: "For independent builders testing lead exchange workflows.",
        features: [
          "Verified profile",
          "Up to 5 partner invites",
          "Basic lead handoff",
        ],
      },
      {
        name: "Growth",
        priceLabel: "$99 / month",
        description: "For growing teams managing multiple trades and regions.",
        features: [
          "Unlimited partner invites",
          "Regional lead routing",
          "Shared project notes",
          "Priority support",
        ],
      },
      {
        name: "Enterprise",
        priceLabel: "Custom",
        description: "For multi-region builders with advanced security and reporting needs.",
        features: [
          "Dedicated success manager",
          "Custom compliance workflows",
          "Advanced reporting",
          "SAML-ready authentication",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I change plans later?",
        answer: "Yes. Upgrade or downgrade any time without losing your data or partner network.",
      },
      {
        question: "Do you offer annual pricing?",
        answer: "Annual billing is available for Growth and Enterprise plans with custom discounts.",
      },
    ],
  },
  leadExchangeWorkflow: {
    slug: "/lead-exchange-workflow",
    title: "Lead Exchange Workflow for Builders and Contractors",
    summary: "A governed workflow for lead intake, partner matching, scoped sharing, and closed-loop project outcomes.",
    keywords: [
      "lead exchange workflow",
      "contractor lead routing",
      "builder referral handoff process",
      "construction lead governance",
    ],
    faqs: [
      {
        question: "How does lead exchange stay controlled?",
        answer: "Leads are routed through role-based workflows with scoped visibility, status checkpoints, and auditable handoff history.",
      },
      {
        question: "Can teams exchange leads across regions?",
        answer: "Yes. Routing logic supports region-aware assignment while preserving compliance and accountability controls.",
      },
    ],
  },
  partnerVerification: {
    slug: "/partner-verification",
    title: "Partner Verification Framework",
    summary: "Verify builder and contractor partners with identity, licensing, insurance, and delivery-readiness controls.",
    keywords: [
      "partner verification",
      "contractor credential checks",
      "builder trust framework",
      "trade partner due diligence",
    ],
    faqs: [
      {
        question: "What proof is required for partner verification?",
        answer: "Teams typically validate legal entity, licence and insurance details, coverage area, and operational capability.",
      },
      {
        question: "Does verification happen once or continuously?",
        answer: "Verification is ongoing with policy-based reviews to maintain trust and compliance over time.",
      },
    ],
  },
  multiRegionHandoffGovernance: {
    slug: "/multi-region-handoff-governance",
    title: "Multi-Region Handoff Governance",
    summary: "Coordinate project handoffs across regions with policy, SLA checkpoints, and clear ownership transitions.",
    keywords: [
      "multi-region handoff governance",
      "cross-region project routing",
      "construction handoff policy",
      "regional service governance",
    ],
    faqs: [
      {
        question: "How are cross-region handoffs governed?",
        answer: "Handoffs follow predefined ownership gates, service-level targets, and compliance policies per region.",
      },
      {
        question: "Can governance adapt to local requirements?",
        answer: "Yes. Teams can enforce local policy controls while keeping global visibility and reporting.",
      },
    ],
  },
  leadRoutingSignals: {
    slug: "/lead-routing-signals",
    title: "Lead Routing Signals and Matching Rules",
    summary: "Define matching signals that improve handoff quality and route each lead to the best-fit verified partner.",
    keywords: [
      "lead routing signals",
      "partner matching rules",
      "construction lead qualification",
      "referral prioritization",
    ],
    faqs: [
      {
        question: "What are the most useful routing signals?",
        answer: "Trade capability, region, current capacity, project complexity, and compliance status are high-impact signals.",
      },
    ],
  },
  verificationEvidenceChecklist: {
    slug: "/verification-evidence-checklist",
    title: "Partner Verification Evidence Checklist",
    summary: "A practical checklist for collecting and validating the evidence needed to onboard trusted partners.",
    keywords: [
      "verification checklist",
      "contractor onboarding evidence",
      "partner compliance documents",
      "trade credential validation",
    ],
    faqs: [
      {
        question: "Why use a checklist for partner verification?",
        answer: "Checklists reduce onboarding errors, improve consistency, and support audit readiness.",
      },
    ],
  },
  regionalHandoffPlaybooks: {
    slug: "/regional-handoff-playbooks",
    title: "Regional Handoff Playbooks",
    summary: "Operational playbooks for cross-region lead acceptance, transfer, and completion updates.",
    keywords: [
      "regional handoff playbooks",
      "cross-region workflow templates",
      "handoff operations guide",
      "service transition process",
    ],
    faqs: [
      {
        question: "When should teams use regional playbooks?",
        answer: "Use playbooks whenever work moves between service areas to maintain quality and consistent communication.",
      },
    ],
  },
};

export type GeoPageKey = keyof typeof geoPages;

const geoPageLocaleOverrides: Partial<Record<string, Partial<Record<GeoPageKey, Partial<GeoPageContent>>>>> = {
  "en-US": {
    home: {
      summary:
        "Join the US network of builders and contractors sharing projects, exchanging work opportunities, and supporting each other's growth.",
    },
  },
  "en-GB": {
    home: {
      summary:
        "Join the UK network of builders and contractors sharing projects, exchanging work opportunities, and supporting each other's growth.",
    },
  },
  "en-AU": {
    home: {
      summary:
        "Join the Australian network of builders and contractors sharing projects, exchanging work opportunities, and supporting each other's growth.",
    },
  },
};

export const getGeoPageContent = (key: GeoPageKey, locale?: string): GeoPageContent => {
  const base = geoPages[key];
  const override = locale ? geoPageLocaleOverrides[locale]?.[key] : undefined;
  return override ? { ...base, ...override } : base;
};
